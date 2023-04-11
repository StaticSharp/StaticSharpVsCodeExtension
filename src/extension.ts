import * as vscode from 'vscode';
import { RepresentativesDataProvider } from './RepresentativesView/RepresentativesDataProvider';
import { PagesDataProvider } from './RoutesView/PagesDataProvider';
import { ProjectMapDataProvider } from './ProjectMapData/ProjectMapDataProvider';
import { GlobalDecorationProvider } from './GlobalDecorationProvider';


export function activate(context: vscode.ExtensionContext) {
	const rootPath = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : undefined;
        
    const projectMapDataProvider: ProjectMapDataProvider = new ProjectMapDataProvider(rootPath)

    const pagesDataProvider = new PagesDataProvider();
    const pagesTreeView =  vscode.window.createTreeView('staticSharpPagesExplorer', {
        treeDataProvider: pagesDataProvider,
        canSelectMany: false,
        showCollapseAll: true
    })
    context.subscriptions.push(pagesTreeView)

    const representativeDataProvider = new RepresentativesDataProvider()
    
    context.subscriptions.push(vscode.window.registerTreeDataProvider('representativesExplorer', representativeDataProvider))
    

    let representativesDecorationProvider = GlobalDecorationProvider.Singleton
    context.subscriptions.push(vscode.window.registerFileDecorationProvider(representativesDecorationProvider))


    pagesTreeView.onDidChangeSelection(e => {
        representativeDataProvider.setPage(e.selection.length>0 ? e.selection[0].model : undefined)
    })

    projectMapDataProvider.onProjectMapChanged(() => {
        pagesDataProvider.setData(projectMapDataProvider.projectMap)    

        let currentPageId = representativeDataProvider.getPageId()
        let currentPageModel = currentPageId ? projectMapDataProvider.pagesMap.get(currentPageId) : undefined
        representativeDataProvider.setPage(currentPageModel)         
    })

    projectMapDataProvider.updatePageMap()

    //fsPromises.rename(oldPath, newPath)

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
