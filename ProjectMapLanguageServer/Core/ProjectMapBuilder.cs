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
using Microsoft.Build.Evaluation;
using Project = Microsoft.CodeAnalysis.Project;

namespace ProjectMapLanguageServer.Core
{ 
    public class ProjectMapBuilder
    {
        public string? ProjectFileName => _project?.FilePath;

        // Suboptimal, but used rarely, so maybe fine
        public Compilation? Compilation => _project?.GetCompilationAsync().Result;


        protected readonly ApiSender _apiSender;


        /// <summary>
        /// * Updating project on files changes suspended (covers massive file updated)
        /// * Updating project on unsaved changes NOT suspended (does it matter?)
        /// * Sending updates to extension suspended
        /// </summary>
        protected bool _projectMapGenerationSuspended = false;

        protected MSBuildWorkspace _workspace { get; set; }

        protected string _workspaceDirectory { get; }

        protected Project? _project { get; set; }

        
        public Dictionary<string, string> UnsavedFiles { get; set; } = new Dictionary<string, string>(); // Key - filename, Value - content

        protected FileSystemWatcher _fsWatcher { get; set; } // TODO: Dispose

        protected object _lock { get; set; } = new object();

        public ProjectMapBuilder(string workspaceDirectory, ApiSender apiSender)
        {
            _workspaceDirectory = workspaceDirectory;
            _apiSender = apiSender;

            var csprojFileName = Directory.EnumerateFiles(_workspaceDirectory, "*.csproj"/*, new EnumerationOptions { MaxRecursionDepth = 0 } */).FirstOrDefault();
            ReloadProject(csprojFileName);
        }

        public void ReloadProject(string? csprojFileName = null)
        {
            SimpleLogger.Instance.Log($"ReloadProject, suspended={_projectMapGenerationSuspended.ToString()}", LogLevel.Debug);

            if (_project == null && csprojFileName == null|| _projectMapGenerationSuspended) {
                return;
            }

            lock (_lock) {
                if (_workspace == null) {
                    MSBuildLocator.RegisterDefaults();
                    _workspace = MSBuildWorkspace.Create();
                }

                _workspace.CloseSolution(); // TODO: review this
                try {
                    _project = _workspace.OpenProjectAsync(csprojFileName ?? _project!.FilePath!).Result;
                }
                catch (Exception ex) {
                    _project = null;
                    SimpleLogger.Instance.Log("Failed to reload project");
                    SimpleLogger.Instance.LogException(ex);
                }

                foreach ((var filename, var filecontent) in UnsavedFiles) {
                    ChangeFileInProject(filename, filecontent);
                }
            }
        }

        public void ChangeFileInProject(string fileName, string? fileContent)
        {
            SimpleLogger.Instance.Log($"ChangeFileInProject, suspended={_projectMapGenerationSuspended}", LogLevel.Debug);
            lock (_lock) {
                if (fileContent != null) {
                    UnsavedFiles[fileName] = fileContent;
                } else {
                    UnsavedFiles.Remove(fileName);
                }

                if (_project == null || _projectMapGenerationSuspended) {
                    return;
                }

                var documentIds = _project.Solution.GetDocumentIdsWithFilePath(fileName);

                if (fileContent != null) {
                    foreach (var documentId in documentIds) {
                        var document = _project.GetDocument(documentId);
                        _project = document.WithText(SourceText.From(fileContent)).Project;
                    }
                } else {
                    foreach (var documentId in documentIds) {
                        var document = _project.GetDocument(documentId);
                        var fileContentFromDisc = File.ReadAllText(fileName);

                        _project = document.WithText(SourceText.From(fileContentFromDisc)).Project;
                    }
                }
            }
        }

        public async Task SendActualProjectMap(bool unsuspend = false) {
            SimpleLogger.Instance.Log($"SendActualProjectMap, suspended={_projectMapGenerationSuspended.ToString()}", LogLevel.Debug);
            
            // If project 
            if (unsuspend) {
                _projectMapGenerationSuspended = false;

                var csprojFileName = Directory.EnumerateFiles(_workspaceDirectory, "*.csproj"/*, new EnumerationOptions { MaxRecursionDepth = 0 } */).FirstOrDefault();
                ReloadProject(csprojFileName);
            }

            if (_projectMapGenerationSuspended) {
                SimpleLogger.Instance.Log("SendActualProjectMap, suspended", LogLevel.Debug);
                return;
            }

            var projectMap = await GenerateProjectMap();
            _apiSender.SendProjectMap(projectMap);
        }

        protected async Task<ProjectMap?> GenerateProjectMap()
        {
            try {
                if (_project == null) {
                    return null;
                }

                var compilation = await _project.GetCompilationAsync();
                var staticSharpSymbols = new StaticSharpSymbols(compilation);

                if (!staticSharpSymbols.IsStaticSharpCoreReferenced) {
                    return null;
                }

                // create basic routes/pages tree
                var pageTreeFactory = new PageTreeFactory(staticSharpSymbols);
                var projectMap = pageTreeFactory.CreatePageTree(compilation, ProjectFileName!);

                // append base pages
                var basePages = staticSharpSymbols.PrimalPageDescendants.Where(_ => _.IsAbstract).ToList(); // TODO: use StaticSharpConventions
                basePages.Add(staticSharpSymbols.PrimalPage);
                projectMap.PageTypes = basePages.Select(p => p.ToString()).ToList();
                
                // TODO: move to dedicated request from extenstion
                //foreach (var basePage in basePages)
                //{

                //    var templateAttribute = basePage.GetAttributes().FirstOrDefault(a => a.AttributeClass.Name == "TemplateAttribute" /*TODO move to StaticSharpConventions*/);
                //    var templateString = templateAttribute?.ConstructorArguments.FirstOrDefault().Value as string; // OrDefault() - in case of syntax error

                //    projectMap.PageTypesWithTemplate.Add((basePage.GetFullyQualifiedNameNoGlobal(), templateString));
                //}


                // append languages
                projectMap.Languages = staticSharpSymbols.LanguageEnum?.MemberNames.ToList() ?? new List<string> { "" };

                // fill in page errors
                StaticSharpProjectValidator.Validate(projectMap, compilation);

                return projectMap;
            }
            catch (Exception ex) {
                SimpleLogger.Instance.Log("Failed to compile project");
                SimpleLogger.Instance.LogException(ex);
                return null;
            }
        }

        public void SuspendProjectMapGeneration()
        {
            _projectMapGenerationSuspended = true;
        }
    }
}
