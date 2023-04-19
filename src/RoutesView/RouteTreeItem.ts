import * as vscode from 'vscode';
import { GlobalDecorationProvider } from '../GlobalDecorationProvider';
import { SimpleLogger } from '../SimpleLogger';
import path = require('path');

export class RouteTreeItem extends vscode.TreeItem
{
    constructor(
        public model: RouteMap,
        
    ) {
        super(model.Name, model.ChildRoutes.length>0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None)
        this.resourceUri = vscode.Uri.parse(`route://${path.join(...model.RelativePathSegments)}`)

        let isInconsistent = model.Pages.some(r => r.ExpectedFilePath != r.FilePath)
        GlobalDecorationProvider.Singleton.updateDecoration(this.resourceUri, 
            isInconsistent ?
            {
                // badge: "⇐",
                color: new vscode.ThemeColor("charts.red"), 
                // tooltip: ""
            }
            : undefined)

        // command is required to prevent expand/collapse on click
        this.command = {
            title: "",
            command: "staticSharp.emptyCommand",
            arguments: []
        }
    }
}