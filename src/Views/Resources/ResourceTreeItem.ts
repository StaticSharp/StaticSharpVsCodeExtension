import * as vscode from 'vscode';

export class ResourceTreeItem extends vscode.TreeItem
{
    constructor(
        public readonly label: string, collapsibleState: vscode.TreeItemCollapsibleState, resourceUri:vscode.Uri
    ) {
        super(label, collapsibleState)

        this.resourceUri = resourceUri

        this.tooltip = resourceUri.toString(true)

        if (collapsibleState === vscode.TreeItemCollapsibleState.None)
        {
            this.command = {
                title: "",
                command: "vscode.open",
                arguments: [vscode.Uri.file(resourceUri.toString(true))]
            }
        }
        
    }
}