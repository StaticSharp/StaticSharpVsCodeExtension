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
                if (args.Length != 1)
                {
                    var message = "Application must be launched with a single argument - global directory path, containgin staticsharp based *.csproj";
                    Console.WriteLine(message);
                    throw new Exception(message);
                }

                var csprojFileName = Directory.EnumerateFiles(args[0], "*.csproj"/*, new EnumerationOptions { MaxRecursionDepth = 0 } */).FirstOrDefault();

                //if (csprojFileName != null)
                //{
                //    throw new Exception("C# Project not found");
                //}

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
                Console.WriteLine("Error on initialization");
                SimpleLogger.Log($"EXCEPTION Type: {e.GetType()}");
                SimpleLogger.Log($"EXCEPTION Message: {e.Message}");
                SimpleLogger.Log($"EXCEPTION StackTrace: {e.StackTrace}");
            }
            finally
            {
                SimpleLogger.Flush();
            }
        }
    }
}