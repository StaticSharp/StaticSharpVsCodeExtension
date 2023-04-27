import * as vscode from 'vscode';
import { PageDataProvider as PagesDataProvider } from './PagesView/PageDataProvider';
import { FixPageDefinitionCommand } from './PagesView/Commands/FixPageDefinitionCommand';
import { RoutesDataProvider } from './RoutesView/RoutesDataProvider';
import { ProjectMapDataProvider } from './ProjectMapData/ProjectMapDataProvider';
import { GlobalDecorationProvider } from './GlobalDecorationProvider';
import { ResourcesDataProvider } from './ResourcesView/ResourcesDataProvider';
import path = require('path');
import { MoveRouteCommand } from './RoutesView/Commands/MoveRouteCommand';
import { RenameRouteCommand } from './RoutesView/Commands/RenameRouteCommand';
import { DeletePageCommand } from './PagesView/Commands/DeletePageCommand';
import { FixPageLocationCommand } from './PagesView/Commands/FixPageLocationCommand';
import { RoutesTreeDndController } from './RoutesView/RoutesTreeDndController';
import { AddChildRouteCommand } from './RoutesView/Commands/AddChildRouteCommand';
import { AddPageCommand } from './PagesView/Commands/AddPageCommand';


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
    const routesTreeDndController = new RoutesTreeDndController();
    const routesTreeView =  vscode.window.createTreeView('routesExplorer', {
        treeDataProvider: routesDataProvider,
        dragAndDropController: routesTreeDndController,
        canSelectMany: false,
        showCollapseAll: true
    })
    
    context.subscriptions.push(routesTreeView)

    const pagesDataProvider = new PagesDataProvider()
    context.subscriptions.push(vscode.window.registerTreeDataProvider('pagesExplorer', pagesDataProvider))

    const resourcesDataProvider = new ResourcesDataProvider()
    context.subscriptions.push(vscode.window.registerTreeDataProvider('resourcesExplorer', resourcesDataProvider))

    let pagesDecorationProvider = GlobalDecorationProvider.singleton
    context.subscriptions.push(vscode.window.registerFileDecorationProvider(pagesDecorationProvider))


    routesTreeView.onDidChangeSelection(e => {
        let selectedRoute = e.selection.length>0 ? e.selection[0].model : undefined
        pagesDataProvider.setData(selectedRoute)
        
        if(selectedRoute?.Pages.some(r => r.ExpectedFilePath !== r.FilePath))
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
        if(currentRouteModel?.Pages.some(r => r.ExpectedFilePath !== r.FilePath))
        {
            resourcesDataProvider.setData(projectMapDataProvider.projectMap?.PathToRoot, undefined)
        }
        else
        {
            resourcesDataProvider.setData(projectMapDataProvider.projectMap?.PathToRoot, currentRouteModel)
        }
    })

    projectMapDataProvider.updateProjectMap()

    //TODO: move commands registration somewhere?
	context.subscriptions.push(vscode.commands.registerCommand('staticSharp.emptyCommand', () => { }))    
    context.subscriptions.push(vscode.commands.registerCommand(DeletePageCommand.commandName, DeletePageCommand.callback))
    context.subscriptions.push(vscode.commands.registerCommand(FixPageLocationCommand.commandName, FixPageLocationCommand.callback))

    FixPageDefinitionCommand.projectMapDataProvider = projectMapDataProvider
    context.subscriptions.push(vscode.commands.registerCommand(FixPageDefinitionCommand.commandName, FixPageDefinitionCommand.callback))       
    
    MoveRouteCommand.projectMapDataProvider = projectMapDataProvider
    context.subscriptions.push(vscode.commands.registerCommand(MoveRouteCommand.commandName, MoveRouteCommand.callback))

    RenameRouteCommand.routesTreeView = routesTreeView
    context.subscriptions.push(vscode.commands.registerCommand(RenameRouteCommand.commandName, RenameRouteCommand.callback))

    AddChildRouteCommand.projectMapDataProvider = projectMapDataProvider
    context.subscriptions.push(vscode.commands.registerCommand(AddChildRouteCommand.commandName, AddChildRouteCommand.callback))

    AddPageCommand.projectMapDataProvider = projectMapDataProvider
    AddPageCommand.routesTreeView = routesTreeView
    context.subscriptions.push(vscode.commands.registerCommand(AddPageCommand.commandName, AddPageCommand.callback))
}

// This method is called when your extension is deactivated
export function deactivate() {} // TODO: Dispose?
