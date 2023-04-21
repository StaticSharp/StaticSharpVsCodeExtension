import { PageTreeItem } from "./PageTreeItem"
import * as vscode from 'vscode';
import * as fs from 'fs';
import path = require("path");
import { ProjectMapDataProvider } from "../ProjectMapData/ProjectMapDataProvider";
import { SimpleLogger } from "../SimpleLogger";
import { MultiEdit } from "../Utilities/MultiEdit";
import { Mapper } from "../Utilities/Mapper";

export class FixPageDefinitionCommand
{
    protected constructor() {}

    static projectMapDataProvider?: ProjectMapDataProvider // TODO: use dependency injection

    static commandName:string = 'staticSharp.fixPageDefinition'
    static callback = async (pageTreeItem: PageTreeItem) => {
        if (!this.projectMapDataProvider)
        {
            SimpleLogger.log(`ERROR: ${this.commandName} invoked but not initialized`)
            return
        }
        
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

        // TODO: instead of saving all, handle open editors in a different way !
        await vscode.workspace.saveAll(false)

        let mainFileText: string
        try {
            mainFileText = fs.readFileSync(mainFilePath, 'utf8');


        } catch (err) {
            vscode.window.showErrorMessage(JSON.stringify(err))
            return
        }



        //HELPERS TODO: move somewhere
        
        let replaceRange = (source:string, start:number, end: number, insertion:string) => 
            source.substring(0, start) + insertion + source.substring(end, source.length)

        let wrapWithNamespace = (content:string, namespace: string) =>
`namespace ${namespace} {

${content}
}`
        
        /// END HELPERS


        let classDefinitionBuffer = mainFileText.substring(descr.ClassDefinition.Start, descr.ClassDefinition.End) // TODO: helper to apply TextEdit

        /// Rename class if needed ///
        const proposedClassName = path.basename(pageTreeItem.model.FilePath, path.extname(pageTreeItem.model.FilePath))
        const className = mainFileText.substring(descr.ClassName.Start, descr.ClassName.End)
        if (proposedClassName != className)
        {
             // TODO: helper to apply TextEdit
            classDefinitionBuffer = replaceRange(classDefinitionBuffer, descr.ClassName.Start - descr.ClassDefinition.Start, descr.ClassName.End - descr.ClassDefinition.Start, proposedClassName)
            // TODO: Modify references, including in buffer
        }


        let relativePagePath = path.relative(this.projectMapDataProvider.projectMap!.PathToRoot, pageTreeItem.model.FilePath);
        let proposedRelativeNamespaceSegments = relativePagePath.split(path.sep).slice(0, -1)
        let namespaceChanged = JSON.stringify(proposedRelativeNamespaceSegments) != JSON.stringify(pageTreeItem.model.Route.RelativePathSegments)
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
            vscode.window.showInformationMessage("Failure")
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
            vscode.window.showInformationMessage(formattingSuccess ? "Success" : "Failure")

        // END FORMATTING
    }
}