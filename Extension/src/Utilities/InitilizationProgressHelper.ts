import * as vscode from 'vscode';
import { RouteTreeItem } from "../Views/Routes/RouteTreeItem";
import { TreeView } from 'vscode';

/**
 * Helps handle "welcome screen" properly: show/hide "Create project" button and progress bars on initialization
 * See also - package.json
 */
export class InitializationProgressHelper
{
    protected constructor() {}

    static _resolveProgress? : (value: any) => void;

    static showProgress()
    {
        if (this._resolveProgress !== undefined) {
            return
        }

        vscode.window.withProgress({location : {viewId: "routesExplorer"}}, (progress, cancelationToken) => {
            return new Promise(resolve => {
                this._resolveProgress = resolve
            })
        })

        // Actually custom context key"staticSharp.initialized" is needed because it can be read (===undefined) before extension activation to disable viewWelcome
        vscode.commands.executeCommand('setContext', 'staticSharp.initialized', false);
    }

    static hideProgress()
    {
        if (this._resolveProgress !== undefined) {
            this._resolveProgress(undefined)
            this._resolveProgress = undefined
            vscode.commands.executeCommand('setContext', 'staticSharp.initialized', true);
        }
    }
}