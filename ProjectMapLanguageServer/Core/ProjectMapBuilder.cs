﻿using Microsoft.Build.Framework;
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
        
        protected readonly ApiSender _apiSender;

        protected bool _projectMapGenerationSuspended = false;

        protected MSBuildWorkspace _workspace { get; set; }
        protected Project? _project { get; set; }

        public string? ProjectFileName => _project?.FilePath;

        public Dictionary<string, string> UnsavedFiles { get; set; } = new Dictionary<string, string>(); // Key - filename, Value - content

        protected FileSystemWatcher _fsWatcher { get; set; } // TODO: Dispose

        public ProjectMapBuilder(string? csprojFileName, ApiSender apiSender)
        {
            _apiSender = apiSender;
            ReloadProject(csprojFileName);
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
            try {
                _project = _workspace.OpenProjectAsync(csprojFileName ?? _project!.FilePath!).Result;
            } catch (Exception ex) {
                _project = null;            
                SimpleLogger.Log("Failed to reload project");
                SimpleLogger.LogException(ex);
            }
            
            foreach ((var filename, var filecontent) in UnsavedFiles)
            {
                ApplyFileChange(filename, filecontent);
            }
        }

        public void UpdateProject(FileUpdatedEvent evt)
        {
            if (evt.HasUnsavedChanges)
            {
                UnsavedFiles[evt.FileName] = evt.FileContent;
                if (_project == null)
                {
                    return;
                }

                ApplyFileChange(evt.FileName, evt.FileContent);
            }
            else
            {
                UnsavedFiles.Remove(evt.FileName);
                if (_project == null)
                {
                    return;
                }

                var documentIds = _project.Solution.GetDocumentIdsWithFilePath(evt.FileName);

                foreach (var documentId in documentIds)
                {
                    var document = _project.GetDocument(documentId);
                    var fileContent = File.ReadAllText(evt.FileName);

                    _project = document.WithText(SourceText.From(fileContent)).Project;
                }
            }
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


        public async Task SendActualProjectMap(bool unsuspend = false)
        {
            if (unsuspend)
            {
                _projectMapGenerationSuspended = false;
            }

            if (_projectMapGenerationSuspended || _project == null)
            {
                return;
            }

            try {
                var compilation = await _project.GetCompilationAsync();
                var staticSharpSymbols = new StaticSharpSymbols(compilation);

                if (!staticSharpSymbols.IsStaticSharpCoreReferenced) {
                    return;// null;
                }

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


                _apiSender.SendProjectMap(projectMap);

                //return projectMap;
            }
            catch (Exception ex)
            {
                SimpleLogger.Log("Failed to compile project");
                SimpleLogger.LogException(ex);
                //return null;
            }
            
        }


        public void SuspendProjectMapGeneration()
        {
            _projectMapGenerationSuspended = true;
        }
    }
}