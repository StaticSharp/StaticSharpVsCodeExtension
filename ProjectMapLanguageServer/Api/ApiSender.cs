using System.Text.Json;
using ProjectMap = ProjectMapLanguageServer.Core.ContractModels.ProjectMap;

namespace ProjectMapLanguageServer.Api
{
    public class ApiSender
    {
        public void SendProjectMap(ProjectMap? projectMap)
        {
            var data = projectMap != null ? JsonSerializer.Serialize(projectMap) : null;
            var outgoingMessage = new MessageToClient
            {
                Type = MessageToClientType.ProjectMap,
                Data = data
            };

            Console.WriteLine(JsonSerializer.Serialize(outgoingMessage));
        }

        public void SendLogMessage(string message, LogLevel loglevel)
        {
            var data = JsonSerializer.Serialize(
                new {
                    Message = message,
                    LogLevel = loglevel
                });
            var outgoingMessage = new MessageToClient {
                Type = MessageToClientType.LogMessage,
                Data = data
            };

            Console.WriteLine(JsonSerializer.Serialize(outgoingMessage));
        }
    }
}
