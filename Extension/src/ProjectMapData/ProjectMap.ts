import { ProjectCsDescription } from "./ProjectCsDescription"
import { RouteMap } from "./RouteMap"

export interface ProjectMap
{
    Name: string
    Debug: string
    Root: RouteMap
    PathToRoot: string
    RootContaingNamespace: string
    PageTypes: string[]
    Languages: string[]
    ProjectCsDescription: ProjectCsDescription
}