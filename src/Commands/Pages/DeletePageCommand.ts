import { PageTreeItem } from '../../Views/Pages/PageTreeItem';
import * as vscode from 'vscode';

export class DeletePageCommand
{
    static readonly commandName = 'staticSharp.deletePage'

    callback = async (pageTreeItem: PageTreeItem) => {
        const userResponse = await vscode.window.showInformationMessage(`Delete route "${pageTreeItem.label}"?`, "Yes", "No")
        
        if (userResponse === "Yes") {
            try {
                await vscode.workspace.fs.delete(vscode.Uri.file(pageTreeItem.filePath))
            } catch (err) {
                vscode.window.showErrorMessage(`Failed: ${err}`)
            }
        }
        
    }
}