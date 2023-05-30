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
        // TODO: create registry of incomming messages and handlers, maybe use Mediatr?
        // {Enum value, Argument type, Handler}, ideally infer argument type from handler
        // TODO: Also consider nodejs ChildProcess.connected
        protected Func<Task> _projectMapRequestHandler { get; }

        protected Func<FileUpdatedEvent, Task> _fileUpdateEventHandler { get;  }

        protected Action _suspendProjectMapGenerationHandler { get; }

        protected Action<LogLevel> _setLogLevelHandler { get; }

        public ApiService(
            Func<Task> projectMapRequestHandler,
            Func<FileUpdatedEvent, Task> fileUpdateEventHandler,
            Action suspendProjectMapGenerationHandler,
            Action<LogLevel> setLogLevelHandler)
        {
            _projectMapRequestHandler = projectMapRequestHandler;
            _fileUpdateEventHandler = fileUpdateEventHandler;
            _suspendProjectMapGenerationHandler = suspendProjectMapGenerationHandler;
            _setLogLevelHandler = setLogLevelHandler;
        }

        public void StartListening()
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
                        SimpleLogger.Instance.LogError($"Incomming message serialization failed. '{incomingMessageString}'");
                        continue;
                    }

                    if (incomingMessage == null)
                    {
                        SimpleLogger.Instance.LogError($"Incomming message is null");
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
                                    SimpleLogger.Instance.LogError($"FileUpdatedEvent: Data is null");
                                }
                            }
                            catch
                            {
                                SimpleLogger.Instance.LogError($"FileUpdatedEvent: Failed to deserialized incommingMessage.Data: '{incomingMessage.Data}'");
                                continue;
                            }

                            _fileUpdateEventHandler(fileUpdatedEvent!);
                            break;

                        case MessageToServerType.SuspendProjectMapGeneration:
                            _suspendProjectMapGenerationHandler();
                            break;

                        case MessageToServerType.SetLogLevel:
                            if (incomingMessage.Data != null && Enum.TryParse(incomingMessage.Data, out LogLevel logLevel)) {
                                _setLogLevelHandler(logLevel);
                            } else {
                                SimpleLogger.Instance.LogError($"Incorrect argument");
                            }

                            break;

                        default:
                            SimpleLogger.Instance.LogError($"Unknown message type: {incomingMessage.Type}");
                            continue;
                    }
                }
                catch (Exception e)
                {
                    SimpleLogger.Instance.LogException(e);
                }
            }
        }
    }
}
