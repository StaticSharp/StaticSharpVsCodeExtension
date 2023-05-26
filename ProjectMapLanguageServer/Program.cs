using Microsoft.Build.Locator;
using Microsoft.CodeAnalysis.MSBuild;
using ProjectMapLanguageServer.Api;
using ProjectMapLanguageServer.Core;

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

                var csprojFileName = Directory.EnumerateFiles(args[0], "*.csproj"/*, new EnumerationOptions { MaxRecursionDepth = 0 } */).FirstOrDefault();
                var projectMapBuilder = new ProjectMapBuilder(csprojFileName);
                var apiService = new ApiService(
                    projectMapBuilder.GetProjectMap,
                    (fileUpdatedEvent) => projectMapBuilder.UpdateProject(fileUpdatedEvent)
                    );

                var projecFilesWatcher = new ProjectFilesWatcher(projectMapBuilder, apiService);
                projecFilesWatcher.StartWatching(args[0]);

                apiService.Start();
            }
            catch (Exception e)
            {
                SimpleLogger.LogException(e);
            }
        }
    }
}