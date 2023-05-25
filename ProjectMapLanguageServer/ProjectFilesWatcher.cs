using ProjectMapLanguageServer.Api;
using ProjectMapLanguageServer.Core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectMapLanguageServer
{
    public class ProjectFilesWatcher
    {
        protected ProjectMapBuilder _projectMapBuilder { get; }
        protected ApiService _apiService { get; }

        protected FileSystemWatcher _fsWatcher { get; set; }

        public ProjectFilesWatcher(ProjectMapBuilder projectMapBuilder, ApiService apiService)
        {
            _projectMapBuilder = projectMapBuilder;
            _apiService = apiService;
        }


        public void StartWatching(string pathToWatch)
        {

            _fsWatcher = new FileSystemWatcher(pathToWatch);

            _fsWatcher.NotifyFilter = NotifyFilters.Attributes
                                 | NotifyFilters.CreationTime
                                 | NotifyFilters.DirectoryName
                                 | NotifyFilters.FileName
                                 | NotifyFilters.LastAccess
                                 | NotifyFilters.LastWrite
                                 | NotifyFilters.Security
                                 | NotifyFilters.Size;

            // _fsWatcher.Changed += OnChanged; // will be notified from vscode. If vscode doesn't know, change should not be accounted???
            _fsWatcher.Created += OnCreated;
            _fsWatcher.Deleted += OnDeleted; 
            _fsWatcher.Renamed += OnRenamed;
            _fsWatcher.Error += OnError;

            //_fsWatcher.Filter = "*.cs";
            _fsWatcher.IncludeSubdirectories = true;
            _fsWatcher.EnableRaisingEvents = true;
        }

        protected void OnCreated(object sender, FileSystemEventArgs e) {
            if (!new string[] { "", ".cs", ".csproj" }.Contains(Path.GetExtension(e.FullPath))) {
                return;
            }

            if (_projectMapBuilder.ProjectFileName == null)
            {
                if (Path.GetExtension(e.FullPath) == ".csproj" && Path.GetDirectoryName(e.FullPath) == _fsWatcher.Path)
                {
                    _projectMapBuilder.ReloadProject(e.FullPath);
                }
            }
            else
            {
                _projectMapBuilder.ReloadProject(); // TODO: optmization?: manipulate changed documents instead of full reload
            }
            
            _apiService.SendProjectMap(_projectMapBuilder.GetProjectMap());
        }

        protected void OnDeleted(object sender, FileSystemEventArgs e) {
            var ext = Path.GetExtension(e.FullPath);
            if (!new string[] { "", ".cs" }.Contains(ext)) {
                return;
            }

            if (ext == ".cs")
            {
                _projectMapBuilder.UnsavedFiles.Remove(e.FullPath);
            }
            else
            {
                var keysToRemove = _projectMapBuilder.UnsavedFiles.Keys.Where(key => key.StartsWith(e.FullPath));
                foreach ( var key in keysToRemove) { _projectMapBuilder.UnsavedFiles.Remove(key); }
            }

            _projectMapBuilder.ReloadProject(); // TODO: optmization?: manipulate changed documents instead of full reload
            _apiService.SendProjectMap(_projectMapBuilder.GetProjectMap());
        }

            protected void OnRenamed(object sender, RenamedEventArgs e)
        {
            if (_projectMapBuilder.UnsavedFiles.ContainsKey(e.OldFullPath))
            {
                _projectMapBuilder.UnsavedFiles[e.FullPath] = _projectMapBuilder.UnsavedFiles[e.OldFullPath];
                _projectMapBuilder.UnsavedFiles.Remove(e.OldFullPath);
            }

            _projectMapBuilder.ReloadProject();
            _apiService.SendProjectMap(_projectMapBuilder.GetProjectMap());
        }

        private static void OnError(object sender, ErrorEventArgs e)
        {
            SimpleLogger.Log($"FileSystemWatcher error: {e.GetException().Message}");
        }
    }
}
