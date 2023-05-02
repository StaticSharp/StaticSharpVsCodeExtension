import * as vscode from 'vscode';
import { TextEncoder } from "util";
import { RouteTreeItem } from "../../RoutesView/RouteTreeItem";
import { TreeView } from "vscode";
import { ProjectMapDataProvider } from "../../ProjectMapData/ProjectMapDataProvider";
import path = require('path');

export class CreateProjectCommand
{
    static readonly commandName = 'staticSharp.createProject'

    // TODO: install staticsharp.templates, warn if dotnet not installed, check template version here
    callback = async () => {
        let newProjectRootUri: vscode.Uri | undefined
        let cwdUri: vscode.Uri | undefined
        let newProjectName: string | undefined

        if (!vscode.workspace.name) {
            newProjectRootUri = await vscode.window.showSaveDialog( {
                saveLabel: "Create project",        
                title: "Choose new project location"
            })

            if (!newProjectRootUri) { return }    

            let cwdPath = newProjectRootUri.fsPath
            cwdUri = vscode.Uri.file(path.dirname(cwdPath))
            newProjectName = path.basename(cwdPath)
        }

        vscode.window.onDidCloseTerminal(t => { 
            if (t === terminal)
            {
                if (t.exitStatus?.code === 0 && !vscode.workspace.name)
                {
                    vscode.commands.executeCommand("vscode.openFolder", newProjectRootUri)
                } else {
                    vscode.window.showErrorMessage(`Failed to create project. Dotnet exit code: ${t.exitStatus?.code}. Reason: ${t.exitStatus?.reason}`)
                }
            }
        }); 

        let terminal = vscode.window.createTerminal({
            shellPath: "dotnet",
            shellArgs: `new staticsharp -n "${newProjectName || ""}"`,
            cwd: cwdUri
        })
    }
}