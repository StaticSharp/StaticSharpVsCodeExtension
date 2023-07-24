using Microsoft.CodeAnalysis.CSharp.Syntax;
using System;
using System.Collections.Generic;
using System.Text;

namespace ProjectMapLanguageServer.Core.ContractModels
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

        [Obsolete("Use dedicated request (extension to language server) type")]
        public List<string> PageTypes { get; set; } = new List<string>();

        [Obsolete("Use dedicated request (extension to language server) type")]
        public List<(string, string?)> PageTypesWithTemplate { get; set; } = new List<(string, string?)>();

        public List<string> Languages { get; set; } = new List<string>();

        public ProjectCsDescription ProjectCsDescription { get; set; }
    }
}
