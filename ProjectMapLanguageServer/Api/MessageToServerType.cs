using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectMapLanguageServer.Api
{
    public enum MessageToServerType
    {
        ProjectMapRequest = 0,
        FileUpdatedEvent = 1
    }
}
