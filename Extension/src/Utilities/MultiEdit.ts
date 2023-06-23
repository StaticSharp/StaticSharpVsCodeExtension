import * as vscode from 'vscode';

export class MultiEdit
{
    protected static _textEdits = new Map<string, vscode.TextEdit[]>()

    protected static _renameEdits = new Map<string, string>()
    
    static pushTextEdit(filePath: string, textEdit: vscode.TextEdit) {
        if (this._textEdits.has(filePath)) {
            let temp = this._textEdits.get(filePath)!
            temp.push(textEdit)                    
        } else {
            this._textEdits.set(filePath, [textEdit])
        }
    }

    static pushRenameEdit(path: string, newPath: string) {
        this._renameEdits.set(path, newPath)
    }

    static clearEdits() {
        this._textEdits.clear()
        this._renameEdits.clear()
    }

    // Pay attention to order:
    // 1 - delete
    // 2 - create
    // 3 - edit
    // 4 - move/rename
    static async applyEdits() {
        const workEdit = new vscode.WorkspaceEdit();

        for (let [filePath, fileTextEdits] of this._textEdits) {
            workEdit.set(vscode.Uri.file(filePath), fileTextEdits)
        }
        
        for (let [path, newPath] of this._renameEdits) {
            workEdit.renameFile(vscode.Uri.file(path), vscode.Uri.file(newPath))
        }

        this._textEdits.clear()
        this._renameEdits.clear()
        return await vscode.workspace.applyEdit(workEdit)
    }
}