import * as vscode from 'vscode';
import { TextEncoder } from "util";
import { RouteTreeItem } from "../../RoutesView/RouteTreeItem";
import { TreeView } from "vscode";
import { ProjectMapDataProvider } from "../../ProjectMapData/ProjectMapDataProvider";
import path = require('path');
import { ReadableStreamDefaultController } from 'stream/web';

export class CreateProjectCommand
{
    static readonly commandName = 'staticSharp.createProject'

    // TODO: install staticsharp.templates, warn if dotnet not installed, check template version here
    callback = async () => {
        let newProjectRootUri: vscode.Uri | undefined
        let cwdUri: vscode.Uri | undefined
        let newProjectName: string | undefined
        let newProjectUri: vscode.Uri | undefined

        if (!vscode.workspace.name) {
            newProjectRootUri = await vscode.window.showSaveDialog( {
                saveLabel: "Create project",        
                title: "Choose new project location"
            })

            if (!newProjectRootUri) { return }    

            let cwdPath = newProjectRootUri.fsPath
            cwdUri = vscode.Uri.file(path.dirname(cwdPath))
            newProjectName = path.basename(cwdPath)
            newProjectUri = vscode.Uri.file(cwdPath)
        }

        const multilanguageResponse = await vscode.window.showQuickPick(["true", "false"],  {
            title: "Enable languages support?"
        });

        if (!multilanguageResponse) { return }


        await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Creating new project",
			cancellable: false
		},  async (progress, token) => {
            return new Promise<void>(async resolve => {
                
                progress.report({ message: "Creating dotnet project...", increment: 50 })
                const dotnetNewTerminal = await VsCodeTerminalHelper.execute({
                    shellPath: "dotnet",
                    shellArgs: `new staticsharp -n "${newProjectName || ""}" -m ${multilanguageResponse} -vs true`,
                    cwd: cwdUri
                })
                
                if (dotnetNewTerminal.exitStatus?.code !== 0)
                {
                    vscode.window.showErrorMessage(`Failed to create project. Dotnet exit code: ${dotnetNewTerminal.exitStatus?.code}. 
                    Reason: ${dotnetNewTerminal.exitStatus?.reason}`)
                    dotnetNewTerminal.show()
                } else if(!vscode.workspace.name) {
                    await vscode.commands.executeCommand("vscode.openFolder", newProjectRootUri)
                }

                resolve()
			});
        })
    }
}

class VsCodeTerminalHelper
{
    protected constructor() {}

    static async execute(options: vscode.TerminalOptions) : Promise<vscode.Terminal>
    {
        let resolveResult: (value: vscode.Terminal) => void
        const resultPromise = new Promise<vscode.Terminal>(resolve => {
            resolveResult = resolve
        });

        let thisTerminal: vscode.Terminal

        vscode.window.onDidCloseTerminal(t => { 
            if (t === thisTerminal)
            {
                resolveResult(thisTerminal);
            }
        }); 

        thisTerminal = vscode.window.createTerminal(options)
        return resultPromise
    }
}