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
                var apiSender = new ApiSender();
                SimpleLogger.Initialize(apiSender);

                SimpleLogger.Instance.Log(">>> StaticSharp Language Server started <<<");

                if (!args.Any())
                {
                    throw new Exception(
                        "Application must be launched with arguments: \n" +
                        "1 - global directory path, containing StaticSharp based *.csproj \n" +
                        "2 - optional int log level: 0(Fatal)..4(Debug) \n");
                }

                if (args.Length > 1) {
                    if (Enum.TryParse(args[1], out LogLevel logLevel)) {
                        SimpleLogger.Instance.LogLevel = logLevel;
                    } else {
                        SimpleLogger.Instance.Log($"Incorrect log level \"${args[1]}\"");
                    }
                }

                var csprojFileName = Directory.EnumerateFiles(args[0], "*.csproj"/*, new EnumerationOptions { MaxRecursionDepth = 0 } */).FirstOrDefault();
                var projectMapBuilder = new ProjectMapBuilder(csprojFileName, apiSender);

                var projecFilesWatcher = new ProjectFilesWatcher(projectMapBuilder, apiSender);
                projecFilesWatcher.StartWatching(args[0]);

                var apiService = new ApiService(
                    () => projectMapBuilder.SendActualProjectMap(true),
                    (fileUpdatedEvent) => {
                        projectMapBuilder.ChangeFileInProject(fileUpdatedEvent.FileName, fileUpdatedEvent.FileContent);
                        return projectMapBuilder.SendActualProjectMap();
                    },
                    projectMapBuilder.SuspendProjectMapGeneration,
                    (logLevel) => {
                        SimpleLogger.Instance.LogLevel = logLevel;
                    }
                    );

                SimpleLogger.Instance.Log(">>> StaticSharp Language Server initialization completed <<<");

                apiService.StartListening();
            }
            catch (Exception e)
            {
                SimpleLogger.Instance.LogException(e);
            }
        }
    }
}