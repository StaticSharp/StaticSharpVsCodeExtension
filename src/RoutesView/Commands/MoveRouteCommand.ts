import { ProjectMapDataProvider } from "../../ProjectMapData/ProjectMapDataProvider"
import * as vscode from 'vscode';
import { MultiEdit } from "../../Utilities/MultiEdit";
import { Mapper } from "../../Utilities/Mapper";
import path = require("path");
import { FileTextRange } from "../../ProjectMapData/FileTextRange";

export class MoveRouteCommand
{
    static readonly commandName = 'staticSharp.moveRouteCommand'

    constructor(
        protected projectMapDataProvider: ProjectMapDataProvider
    ) {}
    
    callback = async (sourcePathSegments: string[], targetPathSegments: string[]) => {
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

        for(let [filePath, namespaces] of Object.entries(this.projectMapDataProvider.projectMap!.ProjectCsDescription.NamespacesDeclarations))
        {
            if (!filePath.startsWith(sourceRelativePath)) { continue }
            let fullFilePath = path.join(this.projectMapDataProvider.projectMap!.PathToRoot, filePath)
            const outerNssCompositeRanges = namespaces as FileTextRange[] 
            
            let document = await vscode.workspace.openTextDocument(vscode.Uri.file(fullFilePath))
            for (let nssRange of outerNssCompositeRanges)
            { 
                let rangeContent = document.getText(Mapper.toRange(nssRange))

                if (rangeContent.startsWith(sourceFullNs))
                {
                    // assumtion: end of range is singleline with no comments. Because of "enswith check"
                    let replacementRange = Mapper.toRange(nssRange)
                    MultiEdit.pushTextEdit(fullFilePath, vscode.TextEdit.replace(replacementRange, targetFullNs))
                }
            }
        }

        await MultiEdit.applyTextEdits()


        // MOVE FILES
    
        const pathToRoot = this.projectMapDataProvider!.projectMap!.PathToRoot
        const sourceDirPath = path.join(pathToRoot, sourceRelativePath)
        const targetDirPath = path.join(pathToRoot, targetRelativePath)    

        try {
            if (!await vscode.workspace.saveAll()) { 
                throw new Error("error in save changes") }
            await vscode.workspace.fs.rename(vscode.Uri.file(sourceDirPath), vscode.Uri.file(targetDirPath))
        } catch (err) {
            vscode.window.showErrorMessage(`Moving files failed: ${err}`) 
        }
    }
}