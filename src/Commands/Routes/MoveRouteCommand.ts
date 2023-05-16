import { ProjectMapDataProvider } from "../../ProjectMapData/ProjectMapDataProvider"
import * as vscode from 'vscode';
import { MultiEdit } from "../../Utilities/MultiEdit";
import { Mapper } from "../../Utilities/Mapper";
import path = require("path");
import { RouteMap } from "../../ProjectMapData/RouteMap";

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

        const isRouteAndSubroutesValid = (route: RouteMap): boolean => {
            return route.Pages.every(p => p.Errors.length === 0) && route.ChildRoutes.every(r => isRouteAndSubroutesValid(r))
        }
        
        const sourceRoute = this.projectMapDataProvider.routesByPath.get(sourceRelativePath)
        if (!isRouteAndSubroutesValid(sourceRoute!)) {
            vscode.window.showErrorMessage("Route or sub-routes have errors. Fix it first")
            return
        }

        if( await vscode.window.showInformationMessage(`Move route/rename "${sourceRelativeNs}" to "${targetRelativeNs}"?`, 
        "Yes", "No",) !== "Yes") {
            return
        }

        // CHANGE ROUTE - NAMESPACE

        for(let [filePath, namespaces] of Object.entries(this.projectMapDataProvider.projectMap!.ProjectCsDescription.NamespacesDeclarations))
        {
            if (!filePath.startsWith(sourceRelativePath)) { continue }
            let fullFilePath = path.join(this.projectMapDataProvider.projectMap!.PathToRoot, filePath)
            
            let document = await vscode.workspace.openTextDocument(vscode.Uri.file(fullFilePath))
            for (let nssRange of namespaces)
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

        let pagesToRename = sourceRoute!.Pages.filter(p => p.ExpectedFilePath === p.FilePath && p.Name.startsWith(sourceRoute!.Name))
        let pagesWithNewNames = pagesToRename.map(p => ({                 
                    page: p,
                    newName: targetPathSegments[targetPathSegments.length-1] + p.Name.slice(sourceRoute!.Name.length)
            }))

        // RENAME PAGES - CLASSES
        // The following actions order chosen experimentally as most relaiable: 
        // 1 - text changes, save, 2 - move route folder, 3 - rename pages files

        for (let pageAndName of pagesWithNewNames)
        {
            //const newPageFilePath = path.join(path.dirname(pageAndName.page.FilePath), pageAndName.newName + path.extname(pageAndName.page.FilePath))
            MultiEdit.pushTextEdit(pageAndName.page.FilePath, vscode.TextEdit.replace(Mapper.toRange(pageAndName.page.PageCsDescription.ClassName), pageAndName.newName))
        }

        await MultiEdit.applyTextEdits()


        // MOVE AND RENAME FILES
    
        const pathToRoot = this.projectMapDataProvider!.projectMap!.PathToRoot
        const sourceDirPath = path.join(pathToRoot, sourceRelativePath)
        const targetDirPath = path.join(pathToRoot, targetRelativePath)    

        try {
            if (!await vscode.workspace.saveAll()) { throw new Error("error on save changes") }
            
            await vscode.workspace.fs.rename(vscode.Uri.file(sourceDirPath), vscode.Uri.file(targetDirPath), {overwrite : true})            

            for (let pageAndName of pagesWithNewNames)
            {
                const oldPageFilePath = path.join(targetDirPath, pageAndName.page.Name + path.extname(pageAndName.page.FilePath))
                const newPageFilePath = path.join(targetDirPath, pageAndName.newName + path.extname(pageAndName.page.FilePath))
                await vscode.workspace.fs.rename(
                    vscode.Uri.file(oldPageFilePath), 
                    vscode.Uri.file(newPageFilePath))
            }
            
        } catch (err) {
            vscode.window.showErrorMessage(`Moving files failed: ${err}`) 
        }
    }
}