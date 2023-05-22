using System;
using System.Collections.Generic;
using System.Text;

namespace ProjectMapLanguageServer.Core.ContractModels
{
    public class FileTextRange
    {
        public int StartLine { get; set; }

        public int StartColumn { get; set; }

        public int EndLine { get; set; }

        public int EndColumn { get; set; }
    }
}
