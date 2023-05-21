using System.Threading;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.CSharp;
using ProjectMapSg.ContractModels;
using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Security.Cryptography.X509Certificates;
using System.Collections.Generic;
using ProjectMapSg.SourcesAnalysis;

namespace ProjectMapSg
{
    [Microsoft.CodeAnalysis.Generator]
    public class ProjectMapSg : ISourceGenerator
    {
        public void Initialize(GeneratorInitializationContext context)
        {

        }

        public void Execute(GeneratorExecutionContext context)
        {
            try {
                // TODO: figure out about AnalyzerConfigOptions
                var targetProjectPath = context.AnalyzerConfigOptions.GlobalOptions.TryGetValue("build_property.projectdir", out var result) ? result : "";
                var projectMapFilePath = Path.Combine(targetProjectPath, "ProjectMap.json");

                var staticSharpSymbols = new StaticSharpSymbols(context.Compilation);

                // create basic routes/pages tree
                var pageTreeFactory = new PageTreeFactory(staticSharpSymbols);
                var projectMap = pageTreeFactory.CreatePageTree(context.Compilation);

                // append base pages
                var basePages = staticSharpSymbols.PrimalPageDescendants.Where(_ => _.IsAbstract).ToList();
                basePages.Add(staticSharpSymbols.PrimalPage);
                projectMap.PageTypes = basePages.Select(p => p.ToString()).ToList();

                // append languages
                projectMap.Languages = staticSharpSymbols.LanguageEnum?.MemberNames.ToList() ?? new List<string> { "" };

                // fill in page errors
                StaticSharpProjectValidator.Validate(projectMap, context.Compilation);

                var projectMapJson = JsonSerializer.Serialize(projectMap);
                File.WriteAllText(projectMapFilePath, projectMapJson);
            }
            catch(Exception e) {
                SimpleLogger.Log($"EXCEPTION Type: {e.GetType()}");
                SimpleLogger.Log($"EXCEPTION Message: {e.Message}");
                SimpleLogger.Log($"EXCEPTION StackTrace: {e.StackTrace}");
            }
            finally {
                SimpleLogger.Flush();
            }
        }   
    }
}
//{Path.Combine(ProjectDirectory.GetPath(), "ProjectMap.json").Replace("\\", "\\\\" )}