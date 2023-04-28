import { PageMap } from "./PageMap"

export interface RouteMap
{
    RelativePathSegments: string[]  // TODO: now calculated in ts, maybe optmize - calc RelativePath in advance
    Name: string
    ChildRoutes: RouteMap[]
    Pages: PageMap[]
    //PathSegments: string[]
    //ResourceFiles: string[]
}