import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class ResourcesDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    protected pageModel?: PageMap
    
    constructor(protected _pathToRoot: string) { }

    setData (pageModel?: PageMap)
    {
        this.pageModel = pageModel
        this._onDidChangeTreeData.fire();
    }

    getPageId = () => this.pageModel?.RelativePath

    getTreeItem(treeItem: vscode.TreeItem): vscode.TreeItem {
        return treeItem;
    }

    getChildren(treeItem?: vscode.TreeItem): vscode.TreeItem[] {
        if (!this.pageModel)
        {
            return []
        }

        let pageAbsolutePath = treeItem ? treeItem.resourceUri!.toString() :  path.join(this._pathToRoot, this.pageModel.RelativePath)
        let dirents = fs.readdirSync(pageAbsolutePath, {withFileTypes : true})   
        let treeItems = dirents.map((dirent) => {
            let treeItem = new vscode.TreeItem(dirent.name, dirent.isDirectory() ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None)
            treeItem.resourceUri = vscode.Uri.file( path.join(pageAbsolutePath, dirent.name))
            return treeItem
        })

        //TODO: exclude child pages

        return treeItems
    }
}