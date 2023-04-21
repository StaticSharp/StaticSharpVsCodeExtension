import * as vscode from 'vscode';

export class Mapper{
    static toRange (fileTextRange: FileTextRange){
        return new vscode.Range(fileTextRange.StartLine, 
            fileTextRange.StartColumn,
            fileTextRange.EndLine, 
            fileTextRange.EndColumn)
    }
    
}