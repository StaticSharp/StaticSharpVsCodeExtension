using System;
using System.Collections.Generic;
using System.Text;

namespace ProjectMapSg.ContractModels
{
    public class ProjectCsDescription
    {
        // Key - relative file path, Value - ranges of composite namespaces declarations, e.g. "System.Text"
        public Dictionary<string, IEnumerable<FileTextRange>> NamespacesDeclarations{ get; set; }
             = new Dictionary<string, IEnumerable<FileTextRange>>();
    }
}
