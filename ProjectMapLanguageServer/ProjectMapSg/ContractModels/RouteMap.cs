using System;
using System.Collections.Generic;
using System.Text;

namespace ProjectMapSg.ContractModels
{
    public class RouteMap
    {
        public RouteMap(string name)
        {
            Name = name;
        }

        public string Name { get; }

        public List<RouteMap> ChildRoutes{ get; set;} = new List<RouteMap>();

        public string Debug {get; set;}

        public List<PageMap> Pages { get; set; } = new List<PageMap>();
    }
}
