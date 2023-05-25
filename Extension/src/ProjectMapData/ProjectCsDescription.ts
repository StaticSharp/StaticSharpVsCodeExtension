import { FileTextRange } from "./FileTextRange";

export interface ProjectCsDescription
{
    NamespacesDeclarations : {[key: string] : FileTextRange[] }
}