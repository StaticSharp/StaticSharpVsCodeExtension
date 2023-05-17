import * as vscode from 'vscode';
import { GlobalDecorationProvider } from '../GlobalDecorationProvider';
import { PageMap } from '../../ProjectMapData/PageMap';
import { FixPageDefinitionCommand } from '../../Commands/Pages/FixPageDefinitionCommand';
import { FixPageLocationCommand } from '../../Commands/Pages/FixPageLocationCommand';
import { PageErrorDescription } from '../../Utilities/PageErrorDescriptions';

export class PageTreeItem extends vscode.TreeItem
{
    constructor(public model: PageMap)
    {
        super(model.Name, vscode.TreeItemCollapsibleState.None)

        this.resourceUri = vscode.Uri.parse(`id://page/${model.FilePath}`)
        this.iconPath = new vscode.ThemeIcon("file-text")

        const hasErrors = model.Errors.length > 0

        if (hasErrors)
        {
            let markdownTooltip = new vscode.MarkdownString(this.resourceUri.fsPath + 
                model.Errors.map(e => `  \n- **${PageErrorDescription.getDescription(e)}**`)

                /*"  \n- **File path does not correspond to class definition**"/* +
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

        this.contextValue =  model.Errors.map(e => `e${e}`).join() //hasErrors ? "incorrectFilePath" : ""
        
        this.command = {
            title: "",
            command: "vscode.open",
            arguments: [vscode.Uri.file(model.FilePath)]
        }
    }
}