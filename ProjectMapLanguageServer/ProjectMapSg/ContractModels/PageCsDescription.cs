using System;
using System.Collections.Generic;
using System.Text;

namespace ProjectMapSg.ContractModels
{
    public class PageCsDescription
    {
        public FileTextRange ClassName { get; set; }

        public FileTextRange ClassDefinition { get; set; }

        public FileTextRange ExclusiveNamespaceWrapper { get; set;}

        public FileTextRange FileScopedNamespace { get; set; }

        public int ProposedDefinitionLine { get; set; }

        public int ProposedDefinitionColumn { get; set; }
    }
}
