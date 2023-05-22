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
                var csprojFileName = Directory.EnumerateFiles(args[0], "*.csproj"/*, new EnumerationOptions { MaxRecursionDepth = 0 } */).FirstOrDefault();

                if (csprojFileName == null)
                {
                    throw new Exception("C# Project not found");
                }

                var projectMapBuilder = new ProjectMapBuilder(csprojFileName);

                var apiService = new ApiService(
                    projectMapBuilder.GetProjectMap,
                    (fileUpdatedEvent) => projectMapBuilder.UpdateProject(fileUpdatedEvent)
                    );

                apiService.Start();
            }
            catch (Exception e)
            {
                Console.WriteLine("Error");
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