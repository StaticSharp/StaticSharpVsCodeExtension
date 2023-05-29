using Microsoft.Build.Locator;
using Microsoft.CodeAnalysis.MSBuild;
using ProjectMapLanguageServer.Api;
using ProjectMapLanguageServer.Core;
using System.Text.Json;

namespace ProjectMapLanguageServer
{
    internal class Program
    {
        static void Main(string[] args)
        {
            try
            {
                SimpleLogger.Log(">>> StaticSharp Language Server started <<<");

                if (!args.Any())
                {
                    throw new Exception("Application must be launched with argument - global directory path, containing StaticSharp based *.csproj");
                }

                var apiSender = new ApiSender();

                var csprojFileName = Directory.EnumerateFiles(args[0], "*.csproj"/*, new EnumerationOptions { MaxRecursionDepth = 0 } */).FirstOrDefault();
                var projectMapBuilder = new ProjectMapBuilder(csprojFileName, apiSender);

                var projecFilesWatcher = new ProjectFilesWatcher(projectMapBuilder, apiSender);
                projecFilesWatcher.StartWatching(args[0]);

                var apiService = new ApiService(
                    () => projectMapBuilder.SendActualProjectMap(true),
                    (fileUpdatedEvent) => {
                        projectMapBuilder.UpdateProject(fileUpdatedEvent);
                        return projectMapBuilder.SendActualProjectMap();
                    },
                    projectMapBuilder.SuspendProjectMapGeneration
                    );

                apiService.Start();
            }
            catch (Exception e)
            {
                SimpleLogger.LogException(e);
            }
        }
    }
}