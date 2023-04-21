import path = require("path");
import { ProjectMapDataProvider } from "../ProjectMapData/ProjectMapDataProvider"
import { SimpleLogger } from "../SimpleLogger"
import * as vscode from 'vscode';
import { Console } from "console";
import { ResourceTreeItem } from '../ResourcesView/ResourceTreeItem';
import * as fsPromises from 'fs/promises';
import * as fs from 'fs';
import { MultiEdit } from "../Utilities/MultiEdit";
import { Mapper } from "../Utilities/Mapper";

export class MoveRouteCommand
{
    protected constructor() {}

    static projectMapDataProvider?: ProjectMapDataProvider // TODO: use dependency injection

    static commandName:string = 'staticSharp.moveRouteCommand'
    static callback = async (sourcePathSegments: string[], targetPathSegments: string[]) => {
        if (!this.projectMapDataProvider)
        {
            SimpleLogger.log(`ERROR: ${this.commandName} invoked but not initialized`)
            return
        }

        const sourceRelativeNs = sourcePathSegments.join(".")
        const targetRelativeNs = targetPathSegments.join(".")
        const sourceFullNs = this.projectMapDataProvider.projectMap?.RootContaingNamespace + "." + sourceRelativeNs
        const targetFullNs = this.projectMapDataProvider.projectMap?.RootContaingNamespace + "." + targetRelativeNs

        const sourceRelativePath = path.join(...sourcePathSegments)
        const targetRelativePath = path.join(...targetPathSegments)

        if (sourceRelativeNs === targetRelativeNs) { return }

        if (sourcePathSegments.length < targetPathSegments.length 
            && sourceRelativeNs === targetPathSegments.slice(0, sourcePathSegments.length).join("."))
        {
            vscode.window.showErrorMessage("Cannot move to descendant route")
            return
        }

        const sourceRoute = this.projectMapDataProvider.routesMap.get(sourceRelativePath)
        if (sourceRoute!.Pages.some(p => p.ExpectedFilePath !== p.FilePath)) { // TODO: recursively over child pages
            vscode.window.showErrorMessage("Cannot move inconsistend route. Fix it first")
            return
        }

        if( await vscode.window.showInformationMessage(`Move route "${sourceRelativeNs}" to "${targetRelativeNs}"?`, 
        "Yes", "No",) !== "Yes") {
            return
        }

        // CHANGE NAMESPACE
        let _this = this
        //let absoluteSurcePath = path.join(this.projectMapDataProvider.projectMap!.PathToRoot, sourceRelativePath)
        for(let [filePath, namespaces] of Object.entries(this.projectMapDataProvider.projectMap!.ProjectCsDescription.NamespacesDeclarations))
        {
            if (!filePath.startsWith(sourceRelativePath)) continue;

            // const pageFilePath = "D:\\GIT\\StaticSharpProjectMapGenerator\\TestProject\\Root\\NewComponent\\NewRepresentative.cs"        
        
            // // TODO: same for all nested cs files
            // const outerNssCompositeRanges : FileTextRange[] = [
            //     { Start: 188+1, StartLine: 8, StartColumn: 43, End: 205+1, EndLine: 8, EndColumn: 60 }, // Root.NewComponent
            // ]

            let fullFilePath = path.join(this.projectMapDataProvider.projectMap!.PathToRoot, filePath)
            const outerNssCompositeRanges = namespaces as FileTextRange[] 
            
            let allNamespacesHandled = true
            let documentContent = (await vscode.workspace.fs.readFile(vscode.Uri.file(fullFilePath))).toString()
            for (let nssRange of outerNssCompositeRanges)
            { 
                let rangeContent = documentContent.substring(nssRange.Start, nssRange.End)
                if (rangeContent.startsWith(sourceFullNs))
                {
                    // assumtion: end of range is singleline with no comments. Because of "enswith check"
                    let replacementRange = Mapper.toRange(nssRange)
                    MultiEdit.pushTextEdit(fullFilePath, vscode.TextEdit.replace(replacementRange, targetFullNs))
                }
                else
                {
                    allNamespacesHandled = false
                }
            }
        }

        

        await MultiEdit.applyTextEdits()


        // MOVE FILES

        await vscode.workspace.saveAll()

        const pathToRoot = this.projectMapDataProvider!.projectMap!.PathToRoot
        const sourceDirPath = path.join(pathToRoot, sourceRelativePath)
        const targetDirPath = path.join(pathToRoot, targetRelativePath)    

        await new Promise<void>((resolve, reject) => 
            //TODO: saveall is overkill            
            vscode.workspace.saveAll(false).then((success) => success
                ? resolve()
                : reject("Move files failed"))
        )        
        .then(() => vscode.workspace.fs.rename(vscode.Uri.file(sourceDirPath), vscode.Uri.file(targetDirPath)))
        .then(() => vscode.window.showInformationMessage("Moved successfully"))
        .catch((err) => vscode.window.showErrorMessage(`Failed: ${err}`) )
    }
}