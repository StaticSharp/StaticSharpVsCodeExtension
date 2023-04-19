import * as vscode from 'vscode';
import * as fs from 'fs';
import { RouteTreeItem as RouteTreeItem } from './RouteTreeItem';

export class RoutesDataProvider implements vscode.TreeDataProvider<RouteTreeItem> {
    
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