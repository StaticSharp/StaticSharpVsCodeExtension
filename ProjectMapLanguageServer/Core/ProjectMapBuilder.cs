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
using Microsoft.CodeAnalysis.CSharp.Syntax;
using ProjectMapLanguageServer.Core.ContractModels;

namespace ProjectMapLanguageServer.Core
{ 
    public class ProjectMapBuilder
    {
        
        protected MSBuildWorkspace _workspace { get; set; }
        protected Project? _project { get; set; }

        public string? ProjectFileName => _project?.FilePath;

        public Dictionary<string, string> UnsavedFiles { get; set; } = new Dictionary<string, string>(); // Key - filename, Value - content

        protected FileSystemWatcher _fsWatcher { get; set; } // TODO: Dispose

        public ProjectMapBuilder(string? csprojFileName)
        {
            if (csprojFileName == null)
            {
                return;
            }

            try
            {
                MSBuildLocator.RegisterDefaults();
                _workspace = MSBuildWorkspace.Create();
                _project = _workspace.OpenProjectAsync(csprojFileName).Result;
            }
            catch
            {
                _project = null;
                return;
            }



            if (_project.ProjectReferences.All(pr => pr.Aliases.All(a => a != "StaticSharp"))) // TODO:
            {
                _project = null;
            }

            //SetUpFileSystemWatcher(Path.GetDirectoryName(csprojFileName));
        }

        public ProjectMap? GetProjectMap()
        {
            if (_project == null)
            {
                return null;
            }

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

        public void ReloadProject(string? csprojFileName = null)
        {
            if (_project == null && csprojFileName == null) {
                return;
            }

            if (_workspace == null)
            {
                MSBuildLocator.RegisterDefaults();
                _workspace = MSBuildWorkspace.Create();
            }

            _workspace.CloseSolution(); // TODO: review this
            _project = _workspace.OpenProjectAsync(csprojFileName ?? _project!.FilePath!).Result;
            foreach ((var filename, var filecontent) in UnsavedFiles)
            {
                ApplyFileChange(filename, filecontent);
            }
        }

        public ProjectMap? UpdateProject(FileUpdatedEvent evt)
        {
            if (evt.HasUnsavedChanges)
            {
                UnsavedFiles[evt.FileName] = evt.FileContent;
                if (_project == null)
                {
                    return null;
                }

                ApplyFileChange(evt.FileName, evt.FileContent);
            }
            else
            {
                UnsavedFiles.Remove(evt.FileName);
                if (_project == null)
                {
                    return null;
                }

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


        protected void ApplyFileChange(string fileName, string fileContent)
        {
            var documentIds = _project.Solution.GetDocumentIdsWithFilePath(fileName);

            foreach (var documentId in documentIds)
            {
                var document = _project.GetDocument(documentId);
                _project = document.WithText(SourceText.From(fileContent)).Project;
            }
        }
    }
}
