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


export function activate(context: vscode.ExtensionContext) {

    const rootPath = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : undefined;
        
    // if (!rootPath) // TODO: "re-activation"
    // {
    //     return
    // }

    const projectMapDataProvider = new ProjectMapDataProvider()
    context.subscriptions.push(projectMapDataProvider)
    projectMapDataProvider.setWorkspace(rootPath)


    // registering visual elements

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


    // orchestration

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

    
}

// This method is called when your extension is deactivated
export function deactivate() {}
