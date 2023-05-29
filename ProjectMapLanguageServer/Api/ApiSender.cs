using ProjectMapLanguageServer.Core.ContractModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

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
    }
}
