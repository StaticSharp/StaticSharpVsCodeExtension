import {window, Tab, TabInputText, Uri, Disposable, Event, EventEmitter, FileDecoration, FileDecorationProvider, ThemeColor} from 'vscode';
import * as vscode from 'vscode';

export enum LogLevel
{
    fatal = 0,
    error = 1,
    warning = 2,
    info = 3,
    debug = 4
}

export class SimpleLogger {
    protected static _outputChannel?: vscode.OutputChannel

    static logLevel = LogLevel.info;

    static log(logline?: string, logLevel:LogLevel = LogLevel.info)
    {
        if (logLevel <= this.logLevel)
        {
            if (!this._outputChannel)
            {
                this._outputChannel = vscode.window.createOutputChannel("StaticSharp Project Map")
            }

            if (logline)
            {
                this._outputChannel.appendLine(logline)
            }
        }
    }
}
