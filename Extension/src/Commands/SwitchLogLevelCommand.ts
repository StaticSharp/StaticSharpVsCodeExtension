import * as vscode from 'vscode';
import {  LogLevel, SimpleLogger } from '../SimpleLogger';
import { type } from 'os';

export class SwitchLogLevelCommand
{
    static readonly commandName = 'staticSharp.switchLogLevelCommand'
    callback = async () => {
        let options = Object.values(LogLevel).filter((v) => isNaN(Number(v))).map(p => p.toString())
        
        let newLogLevel = await vscode.window.showQuickPick(options,  {
                title: "New log level:"
        });

        if (newLogLevel !== undefined)
        {
            SimpleLogger.logLevel = LogLevel[newLogLevel as keyof typeof LogLevel]
        }
    }
}