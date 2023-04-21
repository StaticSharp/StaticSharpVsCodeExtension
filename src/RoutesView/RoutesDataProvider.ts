import * as vscode from 'vscode';
import * as fs from 'fs';
import { RouteTreeItem as RouteTreeItem } from './RouteTreeItem';
import { MoveRouteCommand } from './MoveRouteCommand';

export class RoutesDataProvider implements vscode.TreeDataProvider<RouteTreeItem>, vscode.TreeDragAndDropController<RouteTreeItem> {
    
    /// TreeDragAndDropController, TODO: likely move to separate class
    protected readonly _routesExplorerMimeType = "application/vnd.code.tree.routesExplorer"

    dropMimeTypes: readonly string[] = [this._routesExplorerMimeType];
    dragMimeTypes: readonly string[] = [this._routesExplorerMimeType];



    async handleDrag(source: readonly RouteTreeItem[], dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken) : Promise<void> {
        dataTransfer.set(this._routesExplorerMimeType, new vscode.DataTransferItem(source[0].model.RelativePathSegments))
    }

    async handleDrop(target: RouteTreeItem | undefined, dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken) : Promise<void> {
        if (!target)
        {
            return;
        }

        const transferItem = dataTransfer.get(this._routesExplorerMimeType)
        if (!transferItem) {
			return;
		}

        const sourceRelativePathSegments: string[] = transferItem.value
        vscode.commands.executeCommand(MoveRouteCommand.commandName, sourceRelativePathSegments, 
            [...target?.model.RelativePathSegments, sourceRelativePathSegments[sourceRelativePathSegments.length-1]])
    }

    /// END TreeDragAndDropController
    
    private _onDidChangeTreeData: vscode.EventEmitter<RouteTreeItem | undefined | null | void> = new vscode.EventEmitter<RouteTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<RouteTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
    
    public projectMap?: ProjectMap;


    public setData (projectMap?: ProjectMap)
    {
        this.projectMap = projectMap
        this._onDidChangeTreeData.fire();
    }


    getTreeItem(treeItem: RouteTreeItem): vscode.TreeItem {
        return treeItem;
    }

    getChildren(treeItem?: RouteTreeItem): RouteTreeItem[] {
        if (treeItem) {
            return treeItem.model.ChildRoutes.map(c => new RouteTreeItem(c)).
                sort((a,b) => a.model.Name > b.model.Name ? 1 : a.model.Name==b.model.Name? 0: -1)
        } else {
            return this.projectMap ? [new RouteTreeItem(this.projectMap.Root)] : []
        }
    }
}