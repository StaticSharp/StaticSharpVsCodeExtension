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

        let userResponse = await vscode.window.showInformationMessage(`Delete page "${pageTreeItem.label}"?`, { modal: true }, "Yes", "No")
        
        if (userResponse === "Yes") {
            try {
                await vscode.workspace.fs.delete(vscode.Uri.file(pageTreeItem.model.FilePath))
            } catch (err) {
                vscode.window.showErrorMessage(`Failed: ${err}`, { modal: true })
            }
        }

        const sourceDirUri = vscode.Uri.file(path.dirname(pageTreeItem.model.FilePath))
        await DeletePageCommand.proposeRemoveDirIfEmpty(sourceDirUri)        
    }

    static async proposeRemoveDirIfEmpty(dirUri : vscode.Uri)
    {
        // TODO: check dirs recursively
        const dirContent = await vscode.workspace.fs.readDirectory(dirUri)
        if (dirContent.length === 0)
        {
            let userResponse = await vscode.window.showInformationMessage(`Route directory became empty. Remove it?`, { modal: true }, "Yes", "No")
            if (userResponse === "Yes")
            {
                await vscode.workspace.fs.delete(dirUri, {recursive: true})
            }
        }
    }
}