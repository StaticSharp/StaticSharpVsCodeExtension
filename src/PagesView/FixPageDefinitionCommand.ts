import { PageTreeItem } from "./PageTreeItem"
import * as vscode from 'vscode';
import * as fs from 'fs';
import path = require("path");
import { ProjectMapDataProvider } from "../ProjectMapData/ProjectMapDataProvider";
import { SimpleLogger } from "../SimpleLogger";

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

        let mainFilePath = pageTreeItem.model.FilePath// "D:\\GIT\\StaticSharpProjectMapGenerator\\TestProject\\Root\\Representative2.cs"

        

        let descr: PageCsDescription = 
        {
            ClassName: {
                Start: 279,
                StartLine: 12,
                StartColumn: 17,
                End: 293,
                EndLine: 12,
                EndColumn: 31
            },
            ClassDefinition: {
                Start: 244,
                StartLine: 11,
                StartColumn: 4,
                End: 845,
                EndLine: 27,
                EndColumn: 5
            },
            
            ExclusiveNamespaceWrapper: {
                Start: 171,
                StartLine: 9,
                StartColumn: 0,
                End: 848,
                EndLine: 28,
                EndColumn: 1
            },

            FileScopedNamespace: undefined,

            //ProposedDefinitionStartPosition: 850
            ProposedDefinitionLine: 29,
            ProposedDefinitionColumn: 0
        }

        descr = pageTreeItem.model.PageCsDescription

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
        let textEdits = new Map<string, vscode.TextEdit[]>()
        const pushTextEdit = (filePath: string, textEdit: vscode.TextEdit) => {
            if (textEdits.has(filePath)) {
                let temp = textEdits.get(filePath)!
                temp.push(textEdit)                    
            } else {
                textEdits.set(filePath, [textEdit])
            }
        }

        let replaceRange = (source:string, start:number, end: number, insertion:string) => 
            source.substring(0, start) + insertion + source.substring(end, source.length)

        let wrapWithNamespace = (content:string, namespace: string) =>
`namespace ${namespace} {

${content}
}`
        /// END HELPERS


        let classDefinitionBuffer = mainFileText.substring(descr.ClassDefinition.Start, descr.ClassDefinition.End) // TODO: helper to apply TextEdit
        vscode.window.showInformationMessage('"' + classDefinitionBuffer + '"')


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

        let rangeToReplace = (namespaceChanged && !descr.FileScopedNamespace) 
            ? new vscode.Range( // TODO: add helper-mapper
                descr.ExclusiveNamespaceWrapper!.StartLine, 
                descr.ExclusiveNamespaceWrapper!.StartColumn,
                descr.ExclusiveNamespaceWrapper!.EndLine, 
                descr.ExclusiveNamespaceWrapper!.EndColumn)
            : new vscode.Range(
                descr.ClassDefinition!.StartLine, 
                descr.ClassDefinition!.StartColumn,
                descr.ClassDefinition!.EndLine, 
                descr.ClassDefinition!.EndColumn)
        
        let replacementText = (namespaceChanged && !descr.FileScopedNamespace) 
            ? wrapWithNamespace(classDefinitionBuffer, proposedNamespace)
            : classDefinitionBuffer

        // Handle namespaces references

        pushTextEdit(mainFilePath, new vscode.TextEdit(rangeToReplace, replacementText))

        if (descr.FileScopedNamespace)
        {
            pushTextEdit(mainFilePath, new vscode.TextEdit(
                new vscode.Range(
                    descr.FileScopedNamespace.StartLine,
                    descr.FileScopedNamespace.StartColumn,
                    descr.FileScopedNamespace.EndLine,
                    descr.FileScopedNamespace.EndColumn),
                proposedNamespace))
        }


        const workEdits = new vscode.WorkspaceEdit();
        for (let [filePath, fileTextEdits] of textEdits) {
            workEdits.set(vscode.Uri.file(filePath), fileTextEdits)
        }

        vscode.workspace.applyEdit(workEdits).then(
            (success) => vscode.window.showInformationMessage(success ? "Success" : "Failure"),
        ) 
    }
}