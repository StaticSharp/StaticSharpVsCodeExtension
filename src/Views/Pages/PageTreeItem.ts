import * as vscode from 'vscode';
import { GlobalDecorationProvider } from '../GlobalDecorationProvider';
import { PageMap } from '../../ProjectMapData/PageMap';
import { FixPageDefinitionCommand } from '../../Commands/Pages/FixPageDefinitionCommand';
import { FixPageLocationCommand } from '../../Commands/Pages/FixPageLocationCommand';

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
        this.iconPath = new vscode.ThemeIcon("file-text")

        const hasErrors = this.suggestedFilePath !== undefined

        if (hasErrors)
        {
            let markdownTooltip = new vscode.MarkdownString(this.resourceUri.fsPath + 
                "  \n- **File path does not correspond to class definition**"/* +
                `  \n[Fix location](command:${FixPageLocationCommand.commandName}) [Fix definition](command:${FixPageDefinitionCommand.commandName})`*/)
                // TODO: command callback does not receive current TreeItem
            markdownTooltip.isTrusted = true
            this.tooltip = markdownTooltip
        }
        else
        {
            this.tooltip = this.resourceUri.fsPath
        }

        GlobalDecorationProvider.singleton.updateDecoration(this.resourceUri, 
            hasErrors ?
            {
                // badge: "⇐",
                color: new vscode.ThemeColor("charts.red"), 
                // tooltip: ""
            }
            : undefined)

        this.contextValue = this.suggestedFilePath ? "incorrectFilePath" : ""
        
        this.command = {
            title: "",
            command: "vscode.open",
            arguments: [vscode.Uri.file(filePath)]
        }
    }
}