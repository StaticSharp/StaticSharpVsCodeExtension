import * as vscode from 'vscode';
import { RepresentativesDataProvider } from './RepresentativesView/RepresentativesDataProvider';
import { PagesDataProvider } from './RoutesView/PagesDataProvider';
import { ProjectMapDataProvider } from './ProjectMapData/ProjectMapDataProvider';
import { GlobalDecorationProvider } from './GlobalDecorationProvider';
import * as fs from 'fs';
import { ResourcesDataProvider } from './ResourcesView/ResourcesDataProvider';


export function activate(context: vscode.ExtensionContext) {
	const rootPath = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : undefined;
        
    if (!rootPath)
    {
        return
    }

    const projectMapDataProvider: ProjectMapDataProvider = new ProjectMapDataProvider(rootPath)

    const pagesDataProvider = new PagesDataProvider();
    const pagesTreeView =  vscode.window.createTreeView('staticSharpPagesExplorer', {
        treeDataProvider: pagesDataProvider,
        canSelectMany: false,
        showCollapseAll: true
    })
    
    context.subscriptions.push(pagesTreeView)

    const representativesDataProvider = new RepresentativesDataProvider()
    context.subscriptions.push(vscode.window.registerTreeDataProvider('representativesExplorer', representativesDataProvider))

    const resourcesDataProvider = new ResourcesDataProvider()
    context.subscriptions.push(vscode.window.registerTreeDataProvider('resourcesExplorer', resourcesDataProvider))

    let representativesDecorationProvider = GlobalDecorationProvider.Singleton
    context.subscriptions.push(vscode.window.registerFileDecorationProvider(representativesDecorationProvider))


    pagesTreeView.onDidChangeSelection(e => {
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

    //fsPromises.rename(oldPath, newPath)

	context.subscriptions.push(vscode.commands.registerCommand(
		'staticSharp.emptyCommand', 
		() => { }))

	context.subscriptions.push(vscode.commands.registerCommand(
		'staticSharp.editLanguages', 
		() => {
			vscode.window.showInformationMessage('staticSharp.editLanguages');
		}))

	context.subscriptions.push(vscode.commands.registerCommand(
		'staticSharp.addRepresentative', 
		() => {
			vscode.window.showInformationMessage('staticSharp.addRepresentative');
		}))

	context.subscriptions.push(vscode.commands.registerCommand(
		'staticSharp.deleteRepresentative', 
		() => {
			vscode.window.showInformationMessage('staticSharp.deleteRepresentative');
		}))
}

// This method is called when your extension is deactivated
export function deactivate() {}
