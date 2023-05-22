import * as vscode from 'vscode';
import { PageDataProvider as PagesDataProvider } from './Views/Pages/PageDataProvider';
import { FixPageDefinitionCommand } from './Commands/Pages/FixPageDefinitionCommand';
import { RoutesDataProvider } from './Views/Routes/RoutesDataProvider';
import { ProjectMapDataProvider } from './ProjectMapData/ProjectMapDataProvider';
import { GlobalDecorationProvider } from './Views/GlobalDecorationProvider';
import { ResourcesDataProvider } from './Views/Resources/ResourcesDataProvider';
import { MoveRouteCommand } from './Commands/Routes/MoveRouteCommand';
import { RenameRouteCommand } from './Commands/Routes/RenameRouteCommand';
import { DeletePageCommand } from './Commands/Pages/DeletePageCommand';
import { FixPageLocationCommand } from './Commands/Pages/FixPageLocationCommand';
import { RoutesTreeDndController } from './Views/Routes/RoutesTreeDndController';
import { AddChildRouteCommand } from './Commands/Routes/AddChildRouteCommand';
import { AddPageCommand } from './Commands/Pages/AddPageCommand';
import { EmptyCommand } from './Commands/EmptyCommand';
import { CreateProjectCommand } from './Commands/CreateProjectCommand';
import * as path from 'path';
import { RouteTreeItem } from './Views/Routes/RouteTreeItem';
import { PageTreeItem } from './Views/Pages/PageTreeItem';
import { RouteMap } from './ProjectMapData/RouteMap';
import { ResourceTreeItem } from './Views/Resources/ResourceTreeItem';
import { PageMap } from './ProjectMapData/PageMap';
import { PageError } from './ProjectMapData/PageError';
import { TestLanguageServerCommand } from './Commands/TestLanguageServerCommand';

export function activate(context: vscode.ExtensionContext) {
    const rootPath = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : undefined;
    const projectMapDataProvider = new ProjectMapDataProvider(context.extensionPath, rootPath)
    context.subscriptions.push(projectMapDataProvider)

    // registering visual elements

    const routesDataProvider = new RoutesDataProvider(projectMapDataProvider);
    const routesTreeDndController = new RoutesTreeDndController();
    const routesTreeView =  vscode.window.createTreeView('routesExplorer', {
        treeDataProvider: routesDataProvider,
        dragAndDropController: routesTreeDndController,
        canSelectMany: false,
        showCollapseAll: true
    })

    context.subscriptions.push(routesTreeView)

    const pagesDataProvider = new PagesDataProvider()
    const pagesTreeView =  vscode.window.createTreeView('pagesExplorer', {
        treeDataProvider: pagesDataProvider,
        canSelectMany: false
    })

    const resourcesDataProvider = new ResourcesDataProvider()
    //context.subscriptions.push(vscode.window.registerTreeDataProvider('resourcesExplorer', resourcesDataProvider))
    const resourcesTreeView =  vscode.window.createTreeView('resourcesExplorer', {
        treeDataProvider: resourcesDataProvider,
        canSelectMany: false
    })
    

    context.subscriptions.push(vscode.window.registerFileDecorationProvider(GlobalDecorationProvider.singleton))


    // registering commands

    const registerCommand = (name: string, callback: (...args: any[]) => void | Promise<void>) =>
    context.subscriptions.push(vscode.commands.registerCommand(name, callback))    

    registerCommand(EmptyCommand.commandName, new EmptyCommand().callback)
    registerCommand(CreateProjectCommand.commandName, new CreateProjectCommand().callback)
    registerCommand(DeletePageCommand.commandName, new DeletePageCommand().callback)
    registerCommand(FixPageLocationCommand.commandName, new FixPageLocationCommand().callback)
    registerCommand(FixPageDefinitionCommand.commandName, new FixPageDefinitionCommand(projectMapDataProvider).callback)
    registerCommand(MoveRouteCommand.commandName, new MoveRouteCommand(projectMapDataProvider).callback)
    registerCommand(RenameRouteCommand.commandName, new RenameRouteCommand(routesTreeView).callback)
    registerCommand(AddChildRouteCommand.commandName, new AddChildRouteCommand(projectMapDataProvider).callback)
    registerCommand(AddPageCommand.commandName, new AddPageCommand(projectMapDataProvider, routesTreeView).callback)

    registerCommand(TestLanguageServerCommand.commandName, new TestLanguageServerCommand().callback)


    // orchestration

    routesTreeView.onDidChangeSelection(e => {
        let selectedRoute = e.selection.length>0 ? e.selection[0].model : undefined
        pagesDataProvider.setData(selectedRoute)
        if(selectedRoute?.Pages.some(r => r.Errors.some(e => e === PageError.locationNotMatchDefinition)))
        {
            resourcesDataProvider.setData(projectMapDataProvider.projectMap?.PathToRoot, undefined)
        }
        else
        {
            resourcesDataProvider.setData(projectMapDataProvider.projectMap?.PathToRoot, selectedRoute)
        }
    })

    projectMapDataProvider.onProjectMapChanged(() => {
        routesDataProvider.setData(projectMapDataProvider.projectMap) // TODO: move this inside routesDataProvider
        
        const openDocPath = vscode.window.activeTextEditor?.document.uri.fsPath
        let editedRoute: RouteMap | undefined
        let editedPage: PageMap | undefined
        let editedResourceUri: vscode.Uri | undefined
        if ((routesTreeView.visible || pagesTreeView.visible || resourcesTreeView.visible) 
            && openDocPath && projectMapDataProvider.projectMap) 
        {
            const activePages = projectMapDataProvider.pagesByFilePath.get(openDocPath)

            if (activePages?.length === 1)
            {
                editedPage = activePages[0]
                editedRoute = editedPage.Route
                routesTreeView.reveal(new RouteTreeItem(editedRoute))
            }
            else
            {
                if (openDocPath.toLowerCase().startsWith(projectMapDataProvider.projectMap!.PathToRoot.toLowerCase()))
                {
                    let currentRelativePath = path.relative(projectMapDataProvider.projectMap?.PathToRoot, openDocPath)

                    while(editedRoute === undefined && currentRelativePath !== ".")
                    {
                        currentRelativePath = path.dirname(currentRelativePath)
                        editedRoute = projectMapDataProvider.routesByPath.get(currentRelativePath)
                    }

                    if (editedRoute)
                    {
                        editedResourceUri = vscode.window.activeTextEditor?.document.uri
                        routesTreeView.reveal(new RouteTreeItem(editedRoute))
                    }
                }
            }
        }
        

        let currentRoutePath = pagesDataProvider.getRoutePath()
        let currentRouteModel = currentRoutePath ? projectMapDataProvider.routesByPath.get(currentRoutePath) : undefined
        if (editedRoute)
        {
            currentRouteModel = editedRoute
        }

        pagesDataProvider.setData(currentRouteModel)         

        if(currentRouteModel?.Pages.some(r => r.Errors.some(e => e === PageError.locationNotMatchDefinition))) {
            resourcesDataProvider.setData(projectMapDataProvider.projectMap?.PathToRoot, undefined)
        } else {
            resourcesDataProvider.setData(projectMapDataProvider.projectMap?.PathToRoot, currentRouteModel)
        }

        if (editedPage) {
            pagesTreeView.reveal(new PageTreeItem(editedPage))
        } else if (editedResourceUri) {
            resourcesTreeView.reveal(new ResourceTreeItem(
                path.basename(openDocPath!), 
                vscode.TreeItemCollapsibleState.None,
                editedResourceUri
                ))
        }
    })

    //projectMapDataProvider.updateProjectMap()

    
}

// This method is called when your extension is deactivated
export function deactivate() {
    if (TestLanguageServerCommand.serverProcess)
    {
        TestLanguageServerCommand.serverProcess.kill()
    }
}
