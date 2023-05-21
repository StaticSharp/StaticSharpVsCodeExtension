using System;
using System.Collections.Generic;
using System.Text;

namespace ProjectMapSg.ContractModels
{
    public enum PageError
    {
        // SyntaxErrors = 0, // TODO: some errors is fixed by RoutingSg
        LocationNotMatchDefinition = 10,
        PageNameNotMatchRouteName = 20,
        MultiplePagesPerFile = 30,
        PageHasMultipleDefinitionParts = 40,
        MultiupleNamespacesPerFile = 50
    }
}
