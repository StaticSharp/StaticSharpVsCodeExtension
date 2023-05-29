import * as vscode from 'vscode';

export class MultiEdit
{
    protected static _textEdits = new Map<string, vscode.TextEdit[]>()
    
    static pushTextEdit(filePath: string, textEdit: vscode.TextEdit) {
        if (this._textEdits.has(filePath)) {
            let temp = this._textEdits.get(filePath)!
            temp.push(textEdit)                    
        } else {
            this._textEdits.set(filePath, [textEdit])
        }
    }

    static async applyTextEdits() {
        const workEdits = new vscode.WorkspaceEdit();

        for (let [filePath, fileTextEdits] of this._textEdits) {
            workEdits.set(vscode.Uri.file(filePath), fileTextEdits)
        }
        
        this._textEdits.clear()
        return await vscode.workspace.applyEdit(workEdits)
    }
}