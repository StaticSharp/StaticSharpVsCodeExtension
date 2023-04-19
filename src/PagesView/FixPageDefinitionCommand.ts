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

        let mainFilePath = "D:\\GIT\\StaticSharpProjectMapGenerator\\TestProject\\Root\\Representative2.cs"

        let descr: PageCsDescription = 
        {
            ClassName: {
                filePath: mainFilePath,
                start: 279,
                startLine: 12,
                startColumn: 17,
                end: 293,
                endLine: 12,
                endColumn: 31
            },
            ClassDefinition: {
                filePath: mainFilePath,
                start: 244,
                startLine: 11,
                startColumn: 4,
                end: 845,
                endLine: 27,
                endColumn: 5
            },
            
            ExclusiveNamespaceWrapper: {
                filePath: mainFilePath,
                start: 171,
                startLine: 9,
                startColumn: 0,
                end: 848,
                endLine: 28,
                endColumn: 1
            },

            FileScopedNamespace: undefined,

            //ProposedDefinitionStartPosition: 850
            ProposedDefinitionStartLine: 29,
            ProposedDefinitionStartColumn: 0
        }

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
            vscode.window.showInformationMessage(filePath + " " + textEdits.has(filePath).toString())
            if (textEdits.has(filePath)) {
                let temp = textEdits.get(filePath)!
                temp.push(textEdit)                    
            } else {
                textEdits.set(filePath, [textEdit])
            }
        }

        let replaceRange = (source:string, start:number, end: number, insertion:string) => 
            source.substring(0, start) + insertion + source.substring(end + 1, source.length)

        let wrapWithNamespace = (content:string, namespace: string) =>
`namespace ${proposedNamespace} {

${classDefinitionBuffer}
}`
        /// END HELPERS


        let classDefinitionBuffer = mainFileText.substring(descr.ClassDefinition.start, descr.ClassDefinition.end) // TODO: helper to apply TextEdit

        /// Rename class if needed ///
        const proposedClassName = path.basename(pageTreeItem.model.FilePath, path.extname(pageTreeItem.model.FilePath))
        const className = mainFileText.substring(descr.ClassName.start, descr.ClassName.end)
        if (proposedClassName != className)
        {
             // TODO: helper to apply TextEdit
            classDefinitionBuffer = replaceRange(classDefinitionBuffer, descr.ClassName.start - descr.ClassDefinition.start, descr.ClassName.end - descr.ClassDefinition.start, proposedClassName)
            // TODO: Modify references, including in buffer
        }


        let relativePagePath = path.relative(this.projectMapDataProvider.projectMap!.PathToRoot, pageTreeItem.model.FilePath);
        let proposedRelativeNamespaceSegments = relativePagePath.split(path.sep).slice(0, -1)
        let namespaceChanged = JSON.stringify(proposedRelativeNamespaceSegments) != JSON.stringify(pageTreeItem.model.Route.RelativePathSegments)
        let proposedNamespace = `${this.projectMapDataProvider.projectMap!.RootContaingNamespace}.${proposedRelativeNamespaceSegments.join(".")}`

        let rangeToReplace = (namespaceChanged && !descr.FileScopedNamespace) 
            ? new vscode.Range( // TODO: add helper-mapper
                descr.ExclusiveNamespaceWrapper!.startLine, 
                descr.ExclusiveNamespaceWrapper!.startColumn,
                descr.ExclusiveNamespaceWrapper!.endLine, 
                descr.ExclusiveNamespaceWrapper!.endColumn)
            : new vscode.Range(
                descr.ClassDefinition!.startLine, 
                descr.ClassDefinition!.startColumn,
                descr.ClassDefinition!.endLine, 
                descr.ClassDefinition!.endColumn)
        
        let replacementText = (namespaceChanged && !descr.FileScopedNamespace) 
            ? wrapWithNamespace(classDefinitionBuffer, proposedNamespace)
            : classDefinitionBuffer

        // Handle namespaces references

        pushTextEdit(mainFilePath, new vscode.TextEdit(rangeToReplace, replacementText))

        if (descr.FileScopedNamespace)
        {
            pushTextEdit(mainFilePath, new vscode.TextEdit(
                new vscode.Range(
                    descr.FileScopedNamespace.startLine,
                    descr.FileScopedNamespace.startColumn,
                    descr.FileScopedNamespace.endLine,
                    descr.FileScopedNamespace.endColumn),
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