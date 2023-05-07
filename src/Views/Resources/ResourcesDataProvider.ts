import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ResourceTreeItem } from './ResourceTreeItem';
import { RouteMap } from '../../ProjectMapData/RouteMap';

export class ResourcesDataProvider implements vscode.TreeDataProvider<ResourceTreeItem> {
    
    private _onDidChangeTreeData: vscode.EventEmitter<ResourceTreeItem | undefined | null | void> = new vscode.EventEmitter<ResourceTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ResourceTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    protected _pathToRoot?: string
    protected _routeModel?: RouteMap

    setData (pathToRoot?:string, routeModel?: RouteMap)
    {
        this._routeModel = routeModel
        this._pathToRoot = pathToRoot
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(treeItem: ResourceTreeItem): vscode.TreeItem {
        return treeItem;
    }

    getChildren(treeItem?: ResourceTreeItem): ResourceTreeItem[] {
        if (!this._routeModel)
        {
            return []
        }

        let routeAbsolutePath = treeItem ? treeItem.resourceUri!.toString(true) :  path.join(this._pathToRoot!, ...this._routeModel.RelativePathSegments)
        let dirents = fs.readdirSync(routeAbsolutePath, {withFileTypes : true})   
        let treeItems: Array<ResourceTreeItem> = []

        for(let dirent of dirents)
        {
            let resourceUri = vscode.Uri.parse(path.join(routeAbsolutePath, dirent.name))

            if (this._routeModel!.ChildRoutes.some((childRoute) => resourceUri.toString(true) === 
                path.join(this._pathToRoot!, ...childRoute.RelativePathSegments) )) { continue }

            // TODO: filter out pages of all routes?
            if (this._routeModel!.Pages.some((page) => resourceUri.toString(true) === 
                page.FilePath )) { continue }

            treeItems.push(new ResourceTreeItem(
                dirent.name, 
                dirent.isDirectory() ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
                resourceUri))
        }

        return treeItems
    }
}