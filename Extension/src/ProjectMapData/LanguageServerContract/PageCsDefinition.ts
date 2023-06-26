import { FileTextRange } from "./FileTextRange"

/**
 * Description of page file syntax. TODO: vscode extension should not care about it
 */

export interface PageCsDescription
{
    ClassName: FileTextRange // Partials are not supported for now
    ClassDefinition: FileTextRange // Class body with attributes and comments ,partials ???

    ExclusiveNamespaceWrapper?: FileTextRange // The most outer namespace that contains only current class
	FileScopedNamespace?: FileTextRange
	
    ProposedDefinitionLine: number
    ProposedDefinitionColumn: number

	// ClassNameReferences[]
	// NamespacesReferences[] + handle removal in usings ????
}