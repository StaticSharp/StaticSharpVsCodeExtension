import * as vscode from 'vscode';

export class PageTreeItem extends vscode.TreeItem
{
    public representativesHash: string

    constructor(
        public model: PageMap,
        
    ) {
        super(model.Name, model.ChildPages.length>0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None)
        this.representativesHash = model.ChildPages.map(p => p.Name).join(",")

        // command is required to prevent expand/collapse on click
        this.command = {
            title: "",
            command: "staticSharp.emptyCommand",
            arguments: []
        }
    }
}