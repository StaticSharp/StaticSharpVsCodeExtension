import { PageTreeItem } from '../../Views/Pages/PageTreeItem';
import * as vscode from 'vscode';
import path = require("path");

export class FixPageLocationCommand
{
    static readonly commandName = 'staticSharp.fixPageLocation'

    callback = async (pageTreeItem: PageTreeItem) => {
        let userResponse = await vscode.window.showInformationMessage(`Move page "${pageTreeItem.label}" to "${pageTreeItem.suggestedFilePath}"?`, "Yes", "No")
        if (userResponse !== "Yes") { return }

        await vscode.commands.executeCommand("vscode.open", vscode.Uri.file(pageTreeItem.filePath))
        try {
            if (!await vscode.window.activeTextEditor?.document.save()) {
                throw new Error('error on saving changes') }
            await vscode.workspace.fs.rename(vscode.Uri.file(pageTreeItem.filePath), vscode.Uri.file(pageTreeItem.suggestedFilePath!))

        } catch (err)
        {
            vscode.window.showErrorMessage(`Failed: ${err}`)
            return
        }

        const sourceDirUri = vscode.Uri.file(path.dirname(pageTreeItem.filePath))
        const dirContent = await vscode.workspace.fs.readDirectory(sourceDirUri)
        if (dirContent.length === 0)
        {
            userResponse = await vscode.window.showInformationMessage(`Source directory became empty. Remove it?`, "Yes", "No")
            if (userResponse === "Yes")
            {
                await vscode.workspace.fs.delete(sourceDirUri, {recursive: true})
            }
        }
    }
}