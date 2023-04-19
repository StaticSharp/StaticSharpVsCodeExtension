import * as vscode from 'vscode';
import { RepresentativesDataProvider } from './RepresentativesView/RepresentativesDataProvider';
import { FixRepresentativeDefinitionCommand } from './RepresentativesView/FixRepresentativeDefinitionCommand';
import { RoutesDataProvider } from './RoutesView/PagesDataProvider';
import { ProjectMapDataProvider } from './ProjectMapData/ProjectMapDataProvider';
import { GlobalDecorationProvider } from './GlobalDecorationProvider';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import { ResourcesDataProvider } from './ResourcesView/ResourcesDataProvider';
import { SimpleLogger } from './SimpleLogger';
import { RepresentativeTreeItem } from './RepresentativesView/RepresentativeTreeItem';
import path = require('path');
import { dir } from 'console';
import { Uri } from 'vscode';
import { text } from 'stream/consumers';


export function activate(context: vscode.ExtensionContext) {
	const rootPath = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : undefined;
        
    if (!rootPath)
    {
        return
    }

    const projectMapDataProvider: ProjectMapDataProvider = new ProjectMapDataProvider(rootPath)

    const pagesDataProvider = new RoutesDataProvider();
    const routesTreeView =  vscode.window.createTreeView('routesExplorer', {
        treeDataProvider: pagesDataProvider,
        canSelectMany: false,
        showCollapseAll: true
    })
    
    context.subscriptions.push(routesTreeView)

    const representativesDataProvider = new RepresentativesDataProvider()
    context.subscriptions.push(vscode.window.registerTreeDataProvider('representativesExplorer', representativesDataProvider))

    const resourcesDataProvider = new ResourcesDataProvider()
    context.subscriptions.push(vscode.window.registerTreeDataProvider('resourcesExplorer', resourcesDataProvider))

    let representativesDecorationProvider = GlobalDecorationProvider.Singleton
    context.subscriptions.push(vscode.window.registerFileDecorationProvider(representativesDecorationProvider))


    routesTreeView.onDidChangeSelection(e => {
        let selectedPage = e.selection.length>0 ? e.selection[0].model : undefined
        representativesDataProvider.setData(selectedPage)
        
        if(selectedPage?.Representatives.some(r => r.ExpectedFilePath != r.FilePath))
        {
            resourcesDataProvider.setData(projectMapDataProvider.projectMap?.PathToRoot, undefined)
        }
        else
        {
            resourcesDataProvider.setData(projectMapDataProvider.projectMap?.PathToRoot, selectedPage)
        }
    })

    projectMapDataProvider.onProjectMapChanged(() => {
        pagesDataProvider.setData(projectMapDataProvider.projectMap)    

        let currentPagePath = representativesDataProvider.getPagePath()
        let currentPageModel = currentPagePath ? projectMapDataProvider.pagesMap.get(currentPagePath) : undefined
        representativesDataProvider.setData(currentPageModel)         

        // TODO: is it really needed? Verify Page moved case 
        if(currentPageModel?.Representatives.some(r => r.ExpectedFilePath != r.FilePath))
        {
            resourcesDataProvider.setData(projectMapDataProvider.projectMap?.PathToRoot, undefined)
        }
        else
        {
            resourcesDataProvider.setData(projectMapDataProvider.projectMap?.PathToRoot, currentPageModel)
        }
    })

    projectMapDataProvider.updatePageMap()

	context.subscriptions.push(vscode.commands.registerCommand(
		'staticSharp.emptyCommand', 
		() => { }))

    //TODO: move somewhere

    context.subscriptions.push(vscode.commands.registerCommand(
    'staticSharp.deleteRepresentative', 
    (representativeTreeItem: RepresentativeTreeItem) => {
        vscode.window.showInformationMessage(representativeTreeItem.filePath)
        vscode.window.showInformationMessage(`Delete page "${representativeTreeItem.label}"?`, "Yes", "No", "Yes", "No")
        .then(answer => {
            if (answer === "Yes") {
                //fsPromises.unlink(path)
                fsPromises.rm(representativeTreeItem.filePath)
                .then(() => vscode.window.showInformationMessage("Deleted successfully"))
                .catch((err) => vscode.window.showErrorMessage(`Failed: ${err}`) )
            }
        })
    }))

    context.subscriptions.push(vscode.commands.registerCommand(
        'staticSharp.fixRepresentativeLocation', 
        (representativeTreeItem: RepresentativeTreeItem) => {
            vscode.window.showInformationMessage(vscode.window.activeTextEditor?.document.fileName ?? "undefined")
            vscode.window.showInformationMessage(`Save changes and move page "${representativeTreeItem.label}" to "${representativeTreeItem.suggestedFilePath}"?`, "Yes", "No")
            .then(answer => {
                if (answer === "Yes") {
                    // TODO: page to fix is opened (in 2 places!) because cannot find a way to save changes in non-active editor
                    vscode.commands.executeCommand("vscode.open", vscode.Uri.file(representativeTreeItem.filePath)) 
                    const dirName = path.dirname(representativeTreeItem.suggestedFilePath!)

                    // TODO: async/await?
                    // first is Thenable, others are Promises
                    new Promise<void>((resolve, reject) => 
                        vscode.window.activeTextEditor?.document.save().then((success) => success
                            ? resolve()
                            : reject("Save changes failed"))
                    )
                    .then(() => fsPromises.mkdir(dirName, {recursive : true})
                    .then(() => fsPromises.rename(representativeTreeItem.filePath, representativeTreeItem.suggestedFilePath!))
                    .then(() => vscode.commands.executeCommand("vscode.open", vscode.Uri.file(representativeTreeItem.suggestedFilePath!))) // TODO: close old editor somehow
                    .then(() => vscode.window.showInformationMessage("Moved successfully"))
                    .catch((err) => vscode.window.showErrorMessage(`Failed: ${err}`) ))
                }
            })
        }))

        FixRepresentativeDefinitionCommand.projectMapDataProvider = projectMapDataProvider
        context.subscriptions.push(vscode.commands.registerCommand(
            FixRepresentativeDefinitionCommand.commandName, 
            FixRepresentativeDefinitionCommand.callback))       
}

// This method is called when your extension is deactivated
export function deactivate() {}
