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
        protected Func<Task> _projectMapRequestHandler { get; }

        protected Func<FileUpdatedEvent, Task> _fileUpdateEventHandler { get;  }

        protected Action _suspendProjectMapGenerationHandler { get; }

        public ApiService(
            Func<Task> projectMapRequestHandler,
            Func<FileUpdatedEvent, Task> fileUpdateEventHandler,
            Action suspendProjectMapGenerationHandler)
        {
            _projectMapRequestHandler = projectMapRequestHandler;
            _fileUpdateEventHandler = fileUpdateEventHandler;
            _suspendProjectMapGenerationHandler = suspendProjectMapGenerationHandler;
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
                        SimpleLogger.Log($"Incomming message serialization failed. '{incomingMessageString}'");
                        continue;
                    }

                    if (incomingMessage == null)
                    {
                        SimpleLogger.Log($"Incomming message is null");
                        continue;
                    }

                    // TODO: Review, serializer likely can do it out-of-the-box
                    switch (incomingMessage.Type)
                    {
                        case MessageToServerType.ProjectMapRequest:
                            _projectMapRequestHandler();
                            break;

                        case MessageToServerType.FileUpdatedEvent:
                            FileUpdatedEvent? fileUpdatedEvent;
                            try
                            {
                                fileUpdatedEvent = JsonSerializer.Deserialize<FileUpdatedEvent>(incomingMessage.Data!);
                                if (fileUpdatedEvent == null)
                                {
                                    SimpleLogger.Log($"FileUpdatedEvent: Data is null");
                                }
                            }
                            catch
                            {
                                SimpleLogger.Log($"FileUpdatedEvent: Failed to deserialized incommingMessage.Data: '{incomingMessage.Data}'");
                                continue;
                            }

                            _fileUpdateEventHandler(fileUpdatedEvent!);
                            break;

                        case MessageToServerType.SuspendProjectMapGeneration:
                            _suspendProjectMapGenerationHandler();
                            break;

                        default:
                            SimpleLogger.Log($"Unknown message type: {incomingMessage.Type}");
                            continue;
                    }
                }
                catch (Exception e)
                {
                    SimpleLogger.LogException(e);
                }
            }
        }
    }
}
