import { FileTextRange } from "./FileTextRange";

/**
 * Description of a StaticSharp project files syntax. TODO: vscode extension should not care about it
 */
export interface ProjectCsDescription
{
    NamespacesDeclarations : {[key: string] : FileTextRange[] }
}