import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { RepresentativeTreeItem } from './RepresentativeTreeItem'

export class RepresentativesDataProvider implements vscode.TreeDataProvider<RepresentativeTreeItem> {
    
    private _onDidChangeTreeData: vscode.EventEmitter<RepresentativeTreeItem | undefined | null | void> = new vscode.EventEmitter<RepresentativeTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<RepresentativeTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    protected pageModel?: PageMap

    setData (pageModel?: PageMap)
    {
        this.pageModel = pageModel
        this._onDidChangeTreeData.fire();
    }

    getPagePath = () => this.pageModel?.RelativePath

    getTreeItem(treeItem: RepresentativeTreeItem): vscode.TreeItem {
        return treeItem;
    }

    getChildren(treeItem?: RepresentativeTreeItem): RepresentativeTreeItem[] {
        return treeItem || !this.pageModel ? [] : 
            this.pageModel.Representatives.map(r => new RepresentativeTreeItem(
                r.Name, 
                r.FilePath, 
                r.ExpectedFilePath != r.FilePath ? r.ExpectedFilePath : undefined))
    }
}