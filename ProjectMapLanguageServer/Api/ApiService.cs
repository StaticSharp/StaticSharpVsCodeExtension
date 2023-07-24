using Microsoft.CodeAnalysis.MSBuild;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Text.Json;
using ProjectMap = ProjectMapLanguageServer.Core.ContractModels.ProjectMap;
using System.Text.RegularExpressions;
using Microsoft.CSharp.RuntimeBinder;

namespace ProjectMapLanguageServer.Api
{
    public class ApiService
    {
        // TODO: create registry of incomming messages and handlers, maybe use Mediatr?
        // {Enum value, Argument type, Handler}, ideally infer argument type from handler
        // TODO: Also consider nodejs ChildProcess.connected
        
        protected ApiSender _apiSender { get; }

        protected Func<Task> _projectMapRequestHandler { get; }

        protected Func<DocumentUpdatedEvent, Task> _fileUpdateEventHandler { get;  }

        protected Action _suspendProjectMapGenerationHandler { get; }

        protected Action<LogLevel> _setLogLevelHandler { get; }

        public ApiService(
            ApiSender apiSender,
            Func<Task> projectMapRequestHandler,
            Func<DocumentUpdatedEvent, Task> documentUpdateEventHandler,
            Action suspendProjectMapGenerationHandler,
            Action<LogLevel> setLogLevelHandler)
        {
            _apiSender = apiSender;
            _projectMapRequestHandler = projectMapRequestHandler;
            _fileUpdateEventHandler = documentUpdateEventHandler;
            _suspendProjectMapGenerationHandler = suspendProjectMapGenerationHandler;
            _setLogLevelHandler = setLogLevelHandler;
        }

        protected Dictionary<MessageToServerType, Func<dynamic, dynamic?>> _requestHandlers { get; } 
            = new Dictionary<MessageToServerType, Func<dynamic, dynamic?>>();

        public void AddRequestHandler(MessageToServerType handlerName, Func<dynamic, dynamic> handler)
        {
            _requestHandlers[handlerName] = handler;
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

                    if (incomingMessage.RequestId != null) {
                        if (_requestHandlers.ContainsKey(incomingMessage.Type)) {
                            try {
                                var result = _requestHandlers[incomingMessage.Type].Invoke(incomingMessage.Data);
                                _apiSender.SendResponse(incomingMessage.RequestId!, result);
                            } catch (RuntimeBinderException e)
                            {
                                // ERROR: argument type does not fit into handler delegate
                            }
                        } else {
                            // ERROR: unknown request type / endpoint
                        }
                        
                    } else {
                        // TODO: Review, serializer likely can do it out-of-the-box
                        switch (incomingMessage.Type) {
                            case MessageToServerType.ProjectMapRequest:
                                _projectMapRequestHandler();
                                break;

                            case MessageToServerType.DocumentUpdatedEvent:
                                DocumentUpdatedEvent? documentUpdatedEvent;
                                try {
                                    documentUpdatedEvent = JsonSerializer.Deserialize<DocumentUpdatedEvent>(incomingMessage.Data!);
                                    if (documentUpdatedEvent == null) {
                                        SimpleLogger.Instance.LogError($"DocumentUpdatedEvent: Data is null");
                                    }
                                } catch {
                                    SimpleLogger.Instance.LogError($"DocumentUpdatedEvent: Failed to deserialized incommingMessage.Data: '{incomingMessage.Data}'");
                                    continue;
                                }

                                _fileUpdateEventHandler(documentUpdatedEvent!);
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
                }
                catch (Exception e)
                {
                    SimpleLogger.Instance.LogException(e);
                }
            }
        }
    }
}
