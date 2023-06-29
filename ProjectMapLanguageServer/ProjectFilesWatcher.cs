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
        protected ApiSender _apiSender { get; }

        protected FileSystemWatcher _fsWatcher { get; set; }

        public ProjectFilesWatcher(ProjectMapBuilder projectMapBuilder, ApiSender apiSender)
        {
            _projectMapBuilder = projectMapBuilder;
            _apiSender = apiSender;
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

            // This is needed to free FileSystemWatcher so that it won't skip next events
            Task.Run(async () => {
                SimpleLogger.Instance.Log($"FileSystemWatcher OnCreated: \"{e.Name}\"");
                if (_projectMapBuilder.ProjectFileName == null) {
                    if (Path.GetExtension(e.FullPath) == ".csproj" && Path.GetDirectoryName(e.FullPath) == _fsWatcher.Path) {
                        _projectMapBuilder.ReloadProject(e.FullPath);
                    }
                } else {
                    _projectMapBuilder.ReloadProject(); // TODO: optmization?: manipulate changed documents instead of full reload
                }

                await _projectMapBuilder.SendActualProjectMap();
            });
        }

        protected void OnDeleted(object sender, FileSystemEventArgs e) {
            var ext = Path.GetExtension(e.FullPath);
            if (!new string[] { "", ".cs" }.Contains(ext))
            {
                return;
            }

            Task.Run(async () =>
            {
                SimpleLogger.Instance.Log($"FileSystemWatcher OnDeleted: \"{e.Name}\"");
                if (ext == ".cs")
                {
                    _projectMapBuilder.UnsavedFiles.Remove(e.FullPath);
                }
                else
                {
                    var keysToRemove = _projectMapBuilder.UnsavedFiles.Keys.Where(key => key.StartsWith(e.FullPath));
                    foreach (var key in keysToRemove) { _projectMapBuilder.UnsavedFiles.Remove(key); }
                }

                _projectMapBuilder.ReloadProject(); // TODO: optmization?: manipulate changed documents instead of full reload
                await _projectMapBuilder.SendActualProjectMap();
            });
        }

        protected void OnRenamed(object sender, RenamedEventArgs e)
        {
            Task.Run(async () => {
                SimpleLogger.Instance.Log($"FileSystemWatcher OnRenamed: \"{e.OldName}\" -> \"{e.Name}\"");
                if (_projectMapBuilder.UnsavedFiles.ContainsKey(e.OldFullPath))
                {
                    _projectMapBuilder.UnsavedFiles[e.FullPath] = _projectMapBuilder.UnsavedFiles[e.OldFullPath];
                    _projectMapBuilder.UnsavedFiles.Remove(e.OldFullPath);
                }

                if (Path.GetExtension(e.FullPath) == ".csproj" && Path.GetDirectoryName(e.FullPath) == _fsWatcher.Path)
                {
                    _projectMapBuilder.ReloadProject(e.FullPath);
                }
                else
                {
                    _projectMapBuilder.ReloadProject();
                }
                
                await _projectMapBuilder.SendActualProjectMap();
            });
        }

        private static void OnError(object sender, ErrorEventArgs e)
        {
            SimpleLogger.Instance.LogError($"FileSystemWatcher error: {e.GetException().Message}");
        }
    }
}
