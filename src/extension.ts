import * as vscode from 'vscode';
import { RepresentativesDataProvider } from './RepresentativesDataProvider';
import { PagesDataProvider } from './PagesDataProvider';


export function activate(context: vscode.ExtensionContext) {

	const rootPath = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : undefined;
        
    //vscode.window.registerTreeDataProvider('staticSharpPagesExplorer', new StaticSharpPagesDataProvider(rootPath));
    vscode.window.showInformationMessage("StaticSharp ProjectExplorer activated")

    const pagesDataProvider = new PagesDataProvider(rootPath);
    const pagesTreeView =  vscode.window.createTreeView('staticSharpPagesExplorer', {
        treeDataProvider: pagesDataProvider,
        canSelectMany: false
    })

    pagesTreeView.onDidChangeSelection(e => {
        vscode.window.showInformationMessage(e.selection.map(s => s.label).join(','))
        vscode.window.showInformationMessage("onDidChangeSelection")
        representativeDataProvider.setPage(e.selection.length>0 ? e.selection[0].model : undefined);
    })

    pagesDataProvider.onDidChangeTreeData(e => {
            let currentPageId = representativeDataProvider.getPageId()
            let currentPageModel = currentPageId ? pagesDataProvider.pagesMap.get(currentPageId) : undefined
            representativeDataProvider.setPage(currentPageModel)         
    })
    

    const representativeDataProvider = new RepresentativesDataProvider()
    vscode.window.registerTreeDataProvider('representativesExplorer', representativeDataProvider);

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
