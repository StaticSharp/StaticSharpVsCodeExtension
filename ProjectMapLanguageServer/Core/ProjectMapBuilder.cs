using Microsoft.Build.Framework;
using Microsoft.Build.Locator;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.MSBuild;
using Microsoft.CodeAnalysis.Text;
using ProjectMapLanguageServer.Api;
using ProjectMapLanguageServer.Core.SourcesAnalysis;
using ProjectMapLanguageServer;
using System;
using ProjectMap = ProjectMapLanguageServer.Core.ContractModels.ProjectMap;

namespace ProjectMapLanguageServer.Core
{ 
    public class ProjectMapBuilder
    {
        protected Project _project { get; set; }

        protected Dictionary<string, string> UnsavedFiles { get; set; } = new Dictionary<string, string>(); // Key - filename, Value - content

        public ProjectMapBuilder(string csprojFileName)
        {

            MSBuildLocator.RegisterDefaults();
            var workspace = MSBuildWorkspace.Create();
            _project = workspace.OpenProjectAsync(csprojFileName).Result;
            //project = project.WithAnalyzerReferences(Enumerable.Empty<AnalyzerReference>()); // Remove all source code generators from target project

            //var inputCompilation = await project.GetCompilationAsync();
        }

        public ProjectMap GetProjectMap()
        {
            var compilation = _project.GetCompilationAsync().Result;

            var staticSharpSymbols = new StaticSharpSymbols(compilation);

            // create basic routes/pages tree
            var pageTreeFactory = new PageTreeFactory(staticSharpSymbols);
            var projectMap = pageTreeFactory.CreatePageTree(compilation);

            // append base pages
            var basePages = staticSharpSymbols.PrimalPageDescendants.Where(_ => _.IsAbstract).ToList();
            basePages.Add(staticSharpSymbols.PrimalPage);
            projectMap.PageTypes = basePages.Select(p => p.ToString()).ToList();

            // append languages
            projectMap.Languages = staticSharpSymbols.LanguageEnum?.MemberNames.ToList() ?? new List<string> { "" };

            // fill in page errors
            StaticSharpProjectValidator.Validate(projectMap, compilation);

            return projectMap;
        }

        public ProjectMap UpdateProject(FileUpdatedEvent evt)
        {
            if (evt.HasUnsavedChanges)
            {
                UnsavedFiles[evt.FileName] = evt.FileContent;

                var documentIds = _project.Solution.GetDocumentIdsWithFilePath(evt.FileName);

                foreach (var documentId in documentIds)
                {
                    var document = _project.GetDocument(documentId);
                    //solution.GetDocument(documentId);

                    // This can happen when the client sends a create request for a file that we created on the server,
                    // such as RunCodeAction. Unfortunately, previous attempts to have this fully controlled by the vscode
                    // client (such that it sent both create event and then updated existing text) wasn't successful:
                    // vscode seems to always trigger an update buffer event before triggering the create event.
                    //if (isCreate && string.IsNullOrEmpty(buffer) && (await document.GetTextAsync()).Length > 0)
                    //{
                    //    _logger.LogDebug("File was created with content in workspace, ignoring disk update");
                    //    continue;
                    //}

                    _project = document.WithText(SourceText.From(evt.FileContent)).Project;
                }

                //_project.GetDocument()
            }
            else
            {
                UnsavedFiles.Remove(evt.FileName);

                var documentIds = _project.Solution.GetDocumentIdsWithFilePath(evt.FileName);

                foreach (var documentId in documentIds)
                {
                    var document = _project.GetDocument(documentId);
                    var fileContent = File.ReadAllText(evt.FileName);

                    _project = document.WithText(SourceText.From(fileContent)).Project;
                }
            }

            return GetProjectMap();
        }
    }
}
