import { PageTreeItem } from '../../Views/Pages/PageTreeItem';
import * as vscode from 'vscode';
import { ProjectMapDataProvider } from "../../ProjectMapData/ProjectMapDataProvider";
import { MultiEdit } from "../../Utilities/MultiEdit";
import { Mapper } from "../../Utilities/Mapper";
import path = require("path");

export class FixPageDefinitionCommand
{
    static readonly commandName = 'staticSharp.fixPageDefinition'

    constructor(
        protected projectMapDataProvider: ProjectMapDataProvider
        ) { }
    
    callback = async (pageTreeItem: PageTreeItem) => {      
        // REFERENCES:
        // const referenceLocation = vscode.commands.executeCommand('vscode.executeReferenceProvider',
        //     Uri.file("D:\\GIT\\StaticSharpProjectMapGenerator\\TestProject\\Root\\Representative2.cs"),
        //     new vscode.Position(17, 69), // Position (line, column) of symbol find references for
        // )

        // referenceLocation.then((valRaw: any) => 
        //     {
        //         let val = valRaw as Array<vscode.Location>
        //         SimpleLogger.log(">>> " + val[0].uri)
        //         vscode.window.showInformationMessage("Yes")
        //     }
        // )

        let mainFilePath = pageTreeItem.model.FilePath
        let descr = pageTreeItem.model.PageCsDescription

        let mainDocument = await vscode.workspace.openTextDocument(mainFilePath)

        //HELPERS TODO: move somewhere
        
        let replaceRange = (source:string, start:number, end: number, insertion:string) => 
             source.substring(0, start) + insertion + source.substring(end, source.length)


        let getRelativePosition = (contextPosition: vscode.Position, targetPosition: vscode.Position) =>
            new vscode.Position(
                targetPosition.line - contextPosition.line, 
                contextPosition.line !== targetPosition.line 
                    ? targetPosition.character 
                    : targetPosition.character - contextPosition.character)

        let getRelativeRange = (contextRange: vscode.Range, targetRange: vscode.Range) =>
                new vscode.Range(
                    getRelativePosition(contextRange.start, targetRange.start),
                    getRelativePosition(contextRange.start, targetRange.end))


        let wrapWithNamespace = (content:string, namespace: string) =>
`namespace ${namespace} {

${content}
}`
        
        /// END HELPERS

        const classDefinitionRange = Mapper.toRange(descr.ClassDefinition)
        let classDefinitionBuffer = mainDocument.getText(classDefinitionRange)

        /// Rename class if needed ///
        const proposedClassName = path.basename(pageTreeItem.model.FilePath, path.extname(pageTreeItem.model.FilePath))
        const classNameRange = Mapper.toRange(descr.ClassName)
        const className = mainDocument.getText(classNameRange)
        if (proposedClassName !== className)
        {
            const classDefnitionDocument = await vscode.workspace.openTextDocument({content: classDefinitionBuffer})
            const localClassNameRange = getRelativeRange(classDefinitionRange, classNameRange)
            const startOffset = classDefnitionDocument.offsetAt(localClassNameRange.start)
            const endOffset = classDefnitionDocument.offsetAt(localClassNameRange.end)
            classDefinitionBuffer = replaceRange(classDefinitionBuffer, startOffset, endOffset, proposedClassName)
            
            // TODO: Modify references, including in buffer
        }

        let relativePagePath = path.relative(this.projectMapDataProvider.projectMap!.PathToRoot, pageTreeItem.model.FilePath);
        let proposedRelativeNamespaceSegments = relativePagePath.split(path.sep).slice(0, -1)
        let namespaceChanged = JSON.stringify(proposedRelativeNamespaceSegments) !== JSON.stringify(pageTreeItem.model.Route.RelativePathSegments)
        let proposedNamespace = `${this.projectMapDataProvider.projectMap!.RootContaingNamespace}.${proposedRelativeNamespaceSegments.join(".")}`

        if (namespaceChanged /*&& !descr.FileScopedNamespace*/)
        {
            let rangeToReplace = Mapper.toRange(descr.ExclusiveNamespaceWrapper!)
            let replacementText = wrapWithNamespace(classDefinitionBuffer, proposedNamespace)
            MultiEdit.pushTextEdit(mainFilePath, new vscode.TextEdit(rangeToReplace, ""))
            MultiEdit.pushTextEdit(mainFilePath, new vscode.TextEdit(
                new vscode.Range(
                    descr.ProposedDefinitionLine, 
                    descr.ProposedDefinitionColumn,
                    descr.ProposedDefinitionLine, 
                    descr.ProposedDefinitionColumn), 
                replacementText))

        } else {
            let rangeToReplace = descr.ClassDefinition
            let replacementText = classDefinitionBuffer
            MultiEdit.pushTextEdit(mainFilePath, new vscode.TextEdit(Mapper.toRange(rangeToReplace), replacementText))
        }

        // TODO: Handle namespaces references here

        if (descr.FileScopedNamespace) // TODO: now handled incorrectly!
        {
            MultiEdit.pushTextEdit(mainFilePath, new vscode.TextEdit(
                Mapper.toRange(descr.FileScopedNamespace),
                proposedNamespace))
        }

        let editSuccess = await MultiEdit.applyTextEdits()
        if (!editSuccess) {
            vscode.window.showInformationMessage("Failure on file applying changes")
            return
        }
        
         // FORMATTING

        const formattingEdits: vscode.TextEdit[] = 
            await vscode.commands.executeCommand("vscode.executeFormatDocumentProvider", vscode.Uri.file(mainFilePath))

        for(let e of formattingEdits)
        {
            MultiEdit.pushTextEdit(mainFilePath, e)
        }

        let formattingSuccess = await MultiEdit.applyTextEdits()
        if (!formattingSuccess)    
        {
            vscode.window.showInformationMessage("Failure on formatting")
        }

        // END FORMATTING
    }
}