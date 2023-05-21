using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectMapLanguageServer.Api
{
    public class FileUpdatedEvent
    {
        public string FileName { get; set; }

        public string? FileContent { get; set; }

        public bool HasUnsavedChanges { get; set; }
    }
}
