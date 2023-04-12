import {window, Tab, TabInputText, Uri, Disposable, Event, EventEmitter, FileDecoration, FileDecorationProvider, ThemeColor} from 'vscode';
import * as vscode from 'vscode';


export class SimpleLogger {

    protected static _outputChannel?: vscode.OutputChannel

    static log(logline?: string)
    {
        if (!this._outputChannel)
        {
            this._outputChannel = vscode.window.createOutputChannel("ProjectMap")
        }

        if (logline)
        {
            this._outputChannel.appendLine(logline)
        }
        
    }
}