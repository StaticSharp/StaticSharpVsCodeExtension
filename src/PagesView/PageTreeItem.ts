import * as vscode from 'vscode';
import { GlobalDecorationProvider } from '../GlobalDecorationProvider';
import { publicDecrypt } from 'crypto';

export class PageTreeItem extends vscode.TreeItem
{
    constructor(
        public readonly label: string,
        public readonly filePath: string,
        public readonly suggestedFilePath: string | undefined, // null if path as expected
        public readonly model: PageMap // TODO: once this is added, remove some of other arguments
    ) {
        super(label, vscode.TreeItemCollapsibleState.None)

        this.resourceUri = vscode.Uri.parse(`id://page/${filePath}`)

        GlobalDecorationProvider.Singleton.updateDecoration(this.resourceUri, 
            this.suggestedFilePath ?
            {
                // badge: "⇐",
                color: new vscode.ThemeColor("charts.red"), 
                // tooltip: ""
            }
            : undefined)

        this.contextValue = this.suggestedFilePath ? "incorrectFilePath" : ""
        
        this.tooltip = vscode.Uri.file(filePath).toString(true)
        this.command = {
            title: "",
            command: "vscode.open",
            arguments: [vscode.Uri.file(filePath)]
        }
    }
}