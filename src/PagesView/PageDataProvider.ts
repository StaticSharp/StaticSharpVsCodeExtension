import * as vscode from 'vscode';
import * as path from 'path';
import { PageTreeItem as PageTreeItem } from './PageTreeItem'
import { RouteMap } from '../ProjectMapData/RouteMap';

export class PageDataProvider implements vscode.TreeDataProvider<PageTreeItem> {
    
    private _onDidChangeTreeData: vscode.EventEmitter<PageTreeItem | undefined | null | void> = new vscode.EventEmitter<PageTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<PageTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    protected routeModel?: RouteMap

    setData (routeModel?: RouteMap)
    {
        this.routeModel = routeModel
        this._onDidChangeTreeData.fire();
    }

    getRoutePath = () => this.routeModel ? path.join(...(this.routeModel.RelativePathSegments)) : undefined

    getTreeItem(treeItem: PageTreeItem): vscode.TreeItem {
        return treeItem;
    }

    getChildren(treeItem?: PageTreeItem): PageTreeItem[] {
        return treeItem || !this.routeModel ? [] : 
            this.routeModel.Pages.map(r => new PageTreeItem(
                r.Name, 
                r.FilePath, 
                r.ExpectedFilePath !== r.FilePath ? r.ExpectedFilePath : undefined,
                r))
    }
}