using System;
using System.Collections.Generic;
using System.Text;

namespace ProjectMapSg.ContractModels
{
    public class ProjectMap
    {
        public ProjectMap(string projectName, string rootPageName, string pathToRoot, string rootContainingNamespaceString)
        {
            Name = projectName;
            Root = new RouteMap(rootPageName/*, new List<string> { rootPageName }*/);
            PathToRoot = pathToRoot;
            RootContaingNamespace = rootContainingNamespaceString;
        }

        public string Name { get; set; }

        public string Debug { get; set; }

        //public string Version {get; set;} // TODO: in order to match source generator with VSCode extension

        public RouteMap Root { get; }

        public string PathToRoot { get; }

        public string RootContaingNamespace { get; }

        public List<string> PageTypes { get; set; } = new List<string>();

        public List<string> Languages { get; set; } = new List<string>();

        public ProjectCsDescription ProjectCsDescription { get; set; }
    }
}
