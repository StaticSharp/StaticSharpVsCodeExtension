import * as vscode from 'vscode';
import { GlobalDecorationProvider } from '../GlobalDecorationProvider';
import { SimpleLogger } from '../SimpleLogger';
import path = require('path');

export class PageTreeItem extends vscode.TreeItem
{
    constructor(
        public model: PageMap,
        
    ) {
        super(model.Name, model.ChildPages.length>0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None)
        this.resourceUri = vscode.Uri.parse(`route://${path.join(...model.RelativePathSegments)}`)

        let isInconsistent = model.Representatives.some(r => r.ExpectedFilePath != r.FilePath)
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