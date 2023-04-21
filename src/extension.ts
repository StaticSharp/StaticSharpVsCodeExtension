import * as vscode from 'vscode';
import { PageDataProvider as PagesDataProvider } from './PagesView/PageDataProvider';
import { FixPageDefinitionCommand } from './PagesView/FixPageDefinitionCommand';
import { RoutesDataProvider } from './RoutesView/RoutesDataProvider';
import { ProjectMapDataProvider } from './ProjectMapData/ProjectMapDataProvider';
import { GlobalDecorationProvider } from './GlobalDecorationProvider';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import { ResourcesDataProvider } from './ResourcesView/ResourcesDataProvider';
import { SimpleLogger } from './SimpleLogger';
import { PageTreeItem } from './PagesView/PageTreeItem';
import path = require('path');
import { dir } from 'console';
import { Uri } from 'vscode';
import { text } from 'stream/consumers';
import { MoveRouteCommand } from './RoutesView/MoveRouteCommand';


export function activate(context: vscode.ExtensionContext) {
	const rootPath = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : undefined;
        
    if (!rootPath)
    {
        return
    }

    const projectMapDataProvider: ProjectMapDataProvider = new ProjectMapDataProvider(rootPath)

    const routesDataProvider = new RoutesDataProvider();
    const routesTreeView =  vscode.window.createTreeView('routesExplorer', {
        treeDataProvider: routesDataProvider,
        dragAndDropController: routesDataProvider,
        canSelectMany: false,
        showCollapseAll: true
    })
    
    context.subscriptions.push(routesTreeView)

    const pagesDataProvider = new PagesDataProvider()
    context.subscriptions.push(vscode.window.registerTreeDataProvider('pagesExplorer', pagesDataProvider))

    const resourcesDataProvider = new ResourcesDataProvider()
    context.subscriptions.push(vscode.window.registerTreeDataProvider('resourcesExplorer', resourcesDataProvider))

    let pagesDecorationProvider = GlobalDecorationProvider.Singleton
    context.subscriptions.push(vscode.window.registerFileDecorationProvider(pagesDecorationProvider))


    routesTreeView.onDidChangeSelection(e => {
        let selectedRoute = e.selection.length>0 ? e.selection[0].model : undefined
        pagesDataProvider.setData(selectedRoute)
        
        if(selectedRoute?.Pages.some(r => r.ExpectedFilePath != r.FilePath))
        {
            resourcesDataProvider.setData(projectMapDataProvider.projectMap?.PathToRoot, undefined)
        }
        else
        {
            resourcesDataProvider.setData(projectMapDataProvider.projectMap?.PathToRoot, selectedRoute)
        }
    })

    projectMapDataProvider.onProjectMapChanged(() => {
        routesDataProvider.setData(projectMapDataProvider.projectMap)    

        let currentRoutePath = pagesDataProvider.getRoutePath()
        let currentRouteModel = currentRoutePath ? projectMapDataProvider.routesMap.get(currentRoutePath) : undefined
        pagesDataProvider.setData(currentRouteModel)         

        // TODO: is it really needed? Verify Route moved case 
        if(currentRouteModel?.Pages.some(r => r.ExpectedFilePath != r.FilePath))
        {
            resourcesDataProvider.setData(projectMapDataProvider.projectMap?.PathToRoot, undefined)
        }
        else
        {
            resourcesDataProvider.setData(projectMapDataProvider.projectMap?.PathToRoot, currentRouteModel)
        }
    })

    projectMapDataProvider.updateProjectMap()

	context.subscriptions.push(vscode.commands.registerCommand(
		'staticSharp.emptyCommand', 
		() => { }))    

    //TODO: move somewhere

    context.subscriptions.push(vscode.commands.registerCommand(
    'staticSharp.deletePage', 
    (pageTreeItem: PageTreeItem) => {
        vscode.window.showInformationMessage(`Delete route "${pageTreeItem.label}"?`, "Yes", "No", "Yes", "No")
        .then(answer => {
            if (answer === "Yes") {
                //fsPromises.unlink(path)
                fsPromises.rm(pageTreeItem.filePath)
                .then(() => vscode.window.showInformationMessage("Deleted successfully"))
                .catch((err) => vscode.window.showErrorMessage(`Failed: ${err}`) )
            }
        })
    }))

    context.subscriptions.push(vscode.commands.registerCommand(
        'staticSharp.fixPageLocation', 
        (pageTreeItem: PageTreeItem) => {
            vscode.window.showInformationMessage(`Save changes and move page "${pageTreeItem.label}" to "${pageTreeItem.suggestedFilePath}"?`, "Yes", "No")
            .then(answer => {
                if (answer === "Yes") {
                    // TODO: page to fix is opened (in 2 places!) because cannot find a way to save changes in non-active editor
                    vscode.commands.executeCommand("vscode.open", vscode.Uri.file(pageTreeItem.filePath)) 
                    const dirName = path.dirname(pageTreeItem.suggestedFilePath!)

                    // TODO: async/await?
                    // first is Thenable, others are Promises
                    new Promise<void>((resolve, reject) => 
                        vscode.window.activeTextEditor?.document.save().then((success) => success
                            ? resolve()
                            : reject("Save changes failed"))
                    )
                    .then(() => fsPromises.mkdir(dirName, {recursive : true})
                    .then(() => fsPromises.rename(pageTreeItem.filePath, pageTreeItem.suggestedFilePath!))
                    .then(() => vscode.commands.executeCommand("vscode.open", vscode.Uri.file(pageTreeItem.suggestedFilePath!))) // TODO: close old editor somehow
                    .then(() => vscode.window.showInformationMessage("Moved successfully"))
                    .catch((err) => vscode.window.showErrorMessage(`Failed: ${err}`) ))
                }
            })
    }))

    FixPageDefinitionCommand.projectMapDataProvider = projectMapDataProvider
    context.subscriptions.push(vscode.commands.registerCommand(
        FixPageDefinitionCommand.commandName, 
        FixPageDefinitionCommand.callback
    ))       
    
    MoveRouteCommand.projectMapDataProvider = projectMapDataProvider
    context.subscriptions.push(vscode.commands.registerCommand(
        MoveRouteCommand.commandName, 
        MoveRouteCommand.callback
    ))       
}

// This method is called when your extension is deactivated
export function deactivate() {} // TODO: Dispose?
