using Microsoft.CodeAnalysis.MSBuild;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Text.Json;
using ProjectMap = ProjectMapLanguageServer.Core.ContractModels.ProjectMap;
using System.Text.RegularExpressions;

namespace ProjectMapLanguageServer.Api
{
    public class ApiService
    {
        protected Func<ProjectMap?> _projectMapRequestHandler { get; }

        protected Func<FileUpdatedEvent, ProjectMap?> _fileUpdateEventHandler { get;  }

        public ApiService(
            Func<ProjectMap?> projectMapRequestHandler,
            Func<FileUpdatedEvent, ProjectMap?> fileUpdateEventHandler)
        {
            _projectMapRequestHandler = projectMapRequestHandler;
            _fileUpdateEventHandler = fileUpdateEventHandler;
        }

        public void Start()
        { 
            while (true)
            {
                try
                {
                    var incomingMessageString = Console.ReadLine();
                    MessageToServer? incomingMessage;
                    try
                    {
                        incomingMessage = JsonSerializer.Deserialize<MessageToServer>(incomingMessageString);
                    }
                    catch
                    {
                        Console.WriteLine("Error");
                        SimpleLogger.Log($"Incomming message serialization failed. '{incomingMessageString}'");
                        continue;
                    }

                    if (incomingMessage == null)
                    {
                        Console.WriteLine("Error");
                        SimpleLogger.Log($"Incomming message is null");
                        continue;
                    }

                    // TODO: Review, serializer likely can do it out-of-the-box
                    switch (incomingMessage.Type)
                    {
                        case MessageToServerType.ProjectMapRequest:
                            var projectMap = _projectMapRequestHandler();
                            SendProjectMap(projectMap);
                            break;

                        case MessageToServerType.FileUpdatedEvent:
                            FileUpdatedEvent? fileUpdatedEvent;
                            try
                            {
                                fileUpdatedEvent = JsonSerializer.Deserialize<FileUpdatedEvent>(incomingMessage.Data!);
                                if (fileUpdatedEvent == null)
                                {
                                    Console.WriteLine("Error");
                                    SimpleLogger.Log($"FileUpdatedEvent: Data is null");
                                }
                            }
                            catch
                            {
                                Console.WriteLine("Error");
                                SimpleLogger.Log($"FileUpdatedEvent: Failed to deserialized incommingMessage.Data: '{incomingMessage.Data}'");
                                continue;
                            }

                            projectMap = _fileUpdateEventHandler(fileUpdatedEvent!);
                            SendProjectMap(projectMap);
                            break;

                        default:
                            Console.WriteLine("Error");
                            SimpleLogger.Log($"Unknown message type: {incomingMessage.Type}");
                            continue;
                    }
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

        public void SendProjectMap(ProjectMap? projectMap)
        {
            var data = projectMap != null ? JsonSerializer.Serialize(projectMap) : null;
            var outgoingMessage = new MessageToClient {
                Type = MessageToClientType.ProjectMap,
                Data = data
            };

            Console.WriteLine(JsonSerializer.Serialize(outgoingMessage));
        }
    }
}
