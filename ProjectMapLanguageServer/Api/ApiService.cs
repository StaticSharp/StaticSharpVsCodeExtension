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
        protected Func<ProjectMap> _projectMapRequestHandler { get; }

        protected Func<FileUpdatedEvent, ProjectMap> _fileUpdateEventHandler { get;  }

        public ApiService(
            Func<ProjectMap> projectMapRequestHandler,
            Func<FileUpdatedEvent, ProjectMap> fileUpdateEventHandler)
        {
            _projectMapRequestHandler = projectMapRequestHandler;
            _fileUpdateEventHandler = fileUpdateEventHandler;
        }

        public void Start()
        { 
            while (true)
            {                 
                var incomingMessageString = Console.ReadLine();
                IncomingMessage? incomingMessage;
                try
                {
                    incomingMessage = JsonSerializer.Deserialize<IncomingMessage>(incomingMessageString);
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
                    case IncommingMessageType.ProjectMapRequest:
                        var projectMap = _projectMapRequestHandler();
                        var outgoingMessageString = JsonSerializer.Serialize(projectMap);
                        Console.WriteLine(outgoingMessageString);
                        break;

                    case IncommingMessageType.FileUpdatedEvent:
                        FileUpdatedEvent? fileUpdatedEvent;
                        try {
                            fileUpdatedEvent = JsonSerializer.Deserialize<FileUpdatedEvent>(incomingMessage.Data!);
                            if (fileUpdatedEvent == null)
                            {
                                Console.WriteLine("Error");
                                SimpleLogger.Log($"FileUpdatedEvent: Data is null");
                            }
                        } catch {
                            Console.WriteLine("Error");
                            SimpleLogger.Log($"FileUpdatedEvent: Failed to deserialized incommingMessage.Data: '{incomingMessage.Data}'");
                            continue;
                        }
                        
                        projectMap = _fileUpdateEventHandler(fileUpdatedEvent!);
                        outgoingMessageString = JsonSerializer.Serialize(projectMap);
                        Console.WriteLine(outgoingMessageString);
                        break;

                    default:
                        Console.WriteLine("Error");
                        SimpleLogger.Log($"Unknown message type: {incomingMessage.Type}");
                        continue;
                }
            }
        }

        public async Task SendProjectMap(ProjectMap projectMap)
        {
            var outgoingMessageString = JsonSerializer.Serialize(projectMap);
            Console.WriteLine(outgoingMessageString);
        }
    }
}
