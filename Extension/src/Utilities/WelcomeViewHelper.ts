import * as vscode from 'vscode';
import { RouteTreeItem } from "../Views/Routes/RouteTreeItem";
import { TreeView } from 'vscode';

/**
 * Helps handle "welcome screen" properly: show/hide "Create project" button and progress bars on initialization
 * See also - package.json
 */
export class WelcomeViewHelper
{
    protected constructor() {}

    static _resolveProgress? : (value: any) => void;

    static showInitializationProgress()
    {
        if (this._resolveProgress !== undefined) {
            return
        }

        vscode.window.withProgress({location : {viewId: "routesExplorer"}}, (progress, cancelationToken) => {
            return new Promise(resolve => {
                this._resolveProgress = resolve
            })
        })

        vscode.commands.executeCommand('setContext', 'staticSharp.initialized', false);
    }

    static showDotnetMissing()
    {
        vscode.commands.executeCommand('setContext', 'staticSharp.dotnetMissing', true);
    }

    static showProjectCreating()
    {
        vscode.commands.executeCommand('setContext', 'staticSharp.projectCreating', true);
    }

    static hideProjectCreating()
    {
        vscode.commands.executeCommand('setContext', 'staticSharp.projectCreating', false);
    }

    static hideInitializationProgress()
    {
        if (this._resolveProgress !== undefined) {
            this._resolveProgress(undefined)
            this._resolveProgress = undefined
            vscode.commands.executeCommand('setContext', 'staticSharp.initialized', true);
        }
    }
}