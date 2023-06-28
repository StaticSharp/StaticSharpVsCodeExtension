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

/**
 * Logger. Static, must be initialized. Writes logs to output channel "StaticSharp"
 */
export class SimpleLogger {
    protected static _outputChannel?: vscode.OutputChannel

    static logLevel = LogLevel.debug;

    static readonly logLevelSettingId = 'staticSharp.logLevel';

    static initialized = false;
    static init()
    {
        const settingValue = vscode.workspace.getConfiguration().get(this.logLevelSettingId);
        this.logLevel = LogLevel[settingValue as keyof typeof LogLevel]

        vscode.workspace.onDidChangeConfiguration((evt) => 
        {
            if (evt.affectsConfiguration(this.logLevelSettingId))
            {
                const settingValue = vscode.workspace.getConfiguration().get(this.logLevelSettingId);
                this.logLevel = LogLevel[settingValue as keyof typeof LogLevel]
            }
        })

        this._outputChannel = vscode.window.createOutputChannel("StaticSharp")
        this.initialized = true
    }

    static log(logline: string, logLevel:LogLevel = LogLevel.info)
    {      
        if (!this._outputChannel)
        {
            throw new Error(`SimpleLogger not initialized`)   
        }

        if (logLevel <= this.logLevel)
        {
            let now = new Date();
            let dateFormatted = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}`

            this._outputChannel.appendLine(`${dateFormatted} *${LogLevel[logLevel]}* ${logline}`)
        }
    }
}
