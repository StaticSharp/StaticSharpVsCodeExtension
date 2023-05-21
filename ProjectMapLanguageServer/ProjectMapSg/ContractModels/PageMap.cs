using Microsoft.CodeAnalysis;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Text;
using System.Text.Json.Serialization;

namespace ProjectMapSg.ContractModels
{
    public class PageMap
    {
        public string Name { get; set; }

        public string FilePath { get; set; }

        public PageCsDescription PageCsDescription { get; set; }

        public List<PageError> Errors { get; set; }


        [JsonIgnore] // TODO:  this information should not be needed in vscode extension at all (now it is calculated)
        public string ExpectedFilePath { get; set; }

        [JsonIgnore]
        public RouteMap Route { get; set; }

        [JsonIgnore]
        public INamedTypeSymbol RoslynSymbol { get; set; }

    }
}
