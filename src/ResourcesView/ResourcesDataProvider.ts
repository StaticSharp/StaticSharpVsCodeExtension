import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ResourceTreeItem } from './ResourceTreeItem';

export class ResourcesDataProvider implements vscode.TreeDataProvider<ResourceTreeItem> {
    
    private _onDidChangeTreeData: vscode.EventEmitter<ResourceTreeItem | undefined | null | void> = new vscode.EventEmitter<ResourceTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ResourceTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    protected _pathToRoot?: string
    protected _pageModel?: PageMap


    setData (pathToRoot?:string, pageModel?: PageMap)
    {
        this._pageModel = pageModel
        this._pathToRoot = pathToRoot
        this._onDidChangeTreeData.fire();
    }

    getPageId = () => this._pageModel?.RelativePath

    getTreeItem(treeItem: ResourceTreeItem): vscode.TreeItem {
        return treeItem;
    }

    getChildren(treeItem?: ResourceTreeItem): ResourceTreeItem[] {
        if (!this._pageModel)
        {
            return []
        }

        let pageAbsolutePath = treeItem ? treeItem.resourceUri!.toString(true) :  path.join(this._pathToRoot!, this._pageModel.RelativePath)
        let dirents = fs.readdirSync(pageAbsolutePath, {withFileTypes : true})   
        let treeItems: Array<ResourceTreeItem> = []
        
        for(let dirent of dirents)
        {
            let resourceUri = vscode.Uri.parse(path.join(pageAbsolutePath, dirent.name))

            if (this._pageModel!.ChildPages.some((childPage) => resourceUri.toString(true) === path.join(this._pathToRoot!, childPage.RelativePath) ))
                continue

            if (this._pageModel!.Representatives.some((representative) => resourceUri.toString(true) === representative.FilePath ))
                continue

            treeItems.push(new ResourceTreeItem(
                dirent.name, 
                dirent.isDirectory() ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
                vscode.Uri.parse(path.join(pageAbsolutePath, dirent.name))))
        }

        return treeItems
    }
}