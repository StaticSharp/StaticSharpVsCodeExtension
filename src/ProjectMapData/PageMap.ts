import { PageCsDescription } from "./PageCsDefinition"
import { RouteMap } from "./RouteMap"

export interface PageMap
{
    Name: string
    Route: RouteMap // calculated
    FilePath: string
    ExpectedFilePath: string // TODO: now calculated in ts, relative to Root

    PageCsDescription: PageCsDescription // TODO: rename to nullable FixNamespaceProposal ?
}