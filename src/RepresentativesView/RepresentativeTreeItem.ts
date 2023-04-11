import * as vscode from 'vscode';
import { GlobalDecorationProvider } from '../GlobalDecorationProvider';

export class RepresentativeTreeItem extends vscode.TreeItem
{
    constructor(
        public readonly label: string,
        public readonly filePath: string,
        public readonly suggestedFilePath: string | undefined // null if path as expected
    ) {
        super(label, vscode.TreeItemCollapsibleState.None)

        this.resourceUri = vscode.Uri.parse(`id://representative/${filePath}`)

        GlobalDecorationProvider.Singleton.updateDecoration(this.resourceUri, 
            this.suggestedFilePath ?
            {
                badge: "⇐",
                color: new vscode.ThemeColor("charts.red"), 
                // tooltip: ""
            }
            : undefined)

        this.command = {
            title: "",
            command: "vscode.open",
            arguments: [vscode.Uri.file(filePath)]
        }
    }
}