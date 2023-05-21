using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectMapLanguageServer.Api
{
    internal class IncomingMessage
    {
        public IncommingMessageType Type { get; set; }

        public string? Data { get; set; }
    }
}
