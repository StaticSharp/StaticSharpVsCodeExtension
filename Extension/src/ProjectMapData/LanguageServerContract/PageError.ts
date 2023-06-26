/** type of error on a page */
export enum PageError
{
    syntaxErrors = 0,
    locationNotMatchDefinition = 10,
    pageNameNotMatchRouteName = 20,
    multiplePagesPerFile = 30,
    pageHasMultipleDefinitionParts = 40,
    multiupleNamespacesPerFile = 50
}