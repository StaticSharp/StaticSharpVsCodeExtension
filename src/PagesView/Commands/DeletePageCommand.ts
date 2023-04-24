import { PageTreeItem } from "../PageTreeItem";
import * as vscode from 'vscode';

export class DeletePageCommand
{
    protected constructor() {}

    static commandName:string = 'staticSharp.deletePage'
    static callback = async (pageTreeItem: PageTreeItem) => {
        vscode.window.showInformationMessage(`Delete route "${pageTreeItem.label}"?`, "Yes", "No")
        .then(answer => {
            if (answer === "Yes") {
                vscode.workspace.fs.delete(vscode.Uri.file(pageTreeItem.filePath))
                //fsPromises.rm(pageTreeItem.filePath)
                .then(() => vscode.window.showInformationMessage("Deleted successfully"),
                err => vscode.window.showErrorMessage(`Failed: ${err}`) )
            }
        })
    }
}