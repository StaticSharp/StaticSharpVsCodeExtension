import { PageTreeItem } from '../../Views/Pages/PageTreeItem';
import * as vscode from 'vscode';
import path = require('path');

export class DeletePageCommand
{
    static readonly commandName = 'staticSharp.deletePage'

    constructor(
        protected _pagesTreeView: vscode.TreeView<PageTreeItem>,
    ) {}

    callback = async () => {
        if (this._pagesTreeView.selection.length !== 1) { return }
        const pageTreeItem = this._pagesTreeView.selection[0]

        let userResponse = await vscode.window.showInformationMessage(`Delete route "${pageTreeItem.label}"?`, "Yes", "No")
        
        if (userResponse === "Yes") {
            try {
                await vscode.workspace.fs.delete(vscode.Uri.file(pageTreeItem.model.FilePath))
            } catch (err) {
                vscode.window.showErrorMessage(`Failed: ${err}`)
            }
        }

        const sourceDirUri = vscode.Uri.file(path.dirname(pageTreeItem.model.FilePath))
        const dirContent = await vscode.workspace.fs.readDirectory(sourceDirUri)
        if (dirContent.length === 0)
        {
            userResponse = await vscode.window.showInformationMessage(`Route directory became empty. Remove it?`, "Yes", "No")
            if (userResponse === "Yes")
            {
                await vscode.workspace.fs.delete(sourceDirUri, {recursive: true})
            }
        }
        
    }
}