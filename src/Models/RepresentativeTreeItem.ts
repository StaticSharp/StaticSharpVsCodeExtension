import * as vscode from 'vscode';

export class RepresentativeTreeItem extends vscode.TreeItem
{
    constructor(
        public readonly label: string,
        public readonly filePath: string
    ) {
        super(label, vscode.TreeItemCollapsibleState.None)

        //var fileUri = vscode.Uri.file("D:\\POC\\StaticSharpProjectMap\\StaticSharpProjectMap\\TestTarget\\Root\\About\\Representative.cs")

        this.command = {
            title: "",
            command: "vscode.open",
            arguments: [vscode.Uri.file(filePath)]
        }
    }
}