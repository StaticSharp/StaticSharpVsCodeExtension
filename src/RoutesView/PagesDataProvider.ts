import * as vscode from 'vscode';
import * as fs from 'fs';
import { PageTreeItem } from './PageTreeItem';

export class PagesDataProvider implements vscode.TreeDataProvider<PageTreeItem> {
    
    private _onDidChangeTreeData: vscode.EventEmitter<PageTreeItem | undefined | null | void> = new vscode.EventEmitter<PageTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<PageTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
    
    public projectMap?: ProjectMap;


    public setData (projectMap?: ProjectMap)
    {
        this.projectMap = projectMap
        this._onDidChangeTreeData.fire();
    }


    getTreeItem(treeItem: PageTreeItem): vscode.TreeItem {
        return treeItem;
    }

    getChildren(treeItem?: PageTreeItem): PageTreeItem[] {
        if (treeItem) {
            return treeItem.model.ChildPages.map(c => new PageTreeItem(c)).
                sort((a,b) => a.model.Name > b.model.Name ? 1 : a.model.Name==b.model.Name? 0: -1)
        } else {
            return this.projectMap ? [new PageTreeItem(this.projectMap.Root)] : []
        }
    }
}