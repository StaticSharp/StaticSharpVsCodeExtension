import { PageError } from '../ProjectMapData/PageError';

export class PageErrorDescription
{
    static getDescription(error: PageError)
    {
        switch(error)
        {
            case PageError.syntaxErrors:
                return "Page definition has syntax errors"
            case PageError.locationNotMatchDefinition:
                return "Page definition does not match file location"
            case PageError.pageNameNotMatchRouteName:
                return "Page name does not match route name"
            case PageError.multiplePagesPerFile:
                return "Multiple pages defineded in a single file"
            case PageError.pageHasMultipleDefinitionParts:
                return "Page has more than one definition part (\"partial\" class defnitions)"
            case PageError.multiupleNamespacesPerFile:
                return "Page file has more than one namespace statements"

            default:
                return "Unknown error"
        }
    }
}