import * as vscode from 'vscode';
import path = require('path');
import { ChildProcessHelper } from '../Utilities/ChildProcessHelper';
import { ProjectMapDataProvider } from '../ProjectMapData/ProjectMapDataProvider';
import { WelcomeViewHelper } from '../Utilities/WelcomeViewHelper';

export class CreateProjectCommand
{
    static readonly commandName = 'staticSharp.createProject'

    constructor(
        protected _projectMapDataProvider: ProjectMapDataProvider,
    ) {}

    callback = async () => {
        let newProjectRootUri: vscode.Uri | undefined
        let cwdPath: string | undefined = vscode.workspace.workspaceFolders 
            ? vscode.workspace.workspaceFolders[0].uri.fsPath
            : undefined
        let newProjectName: string | undefined

        if (!vscode.workspace.name) {
            newProjectRootUri = await vscode.window.showSaveDialog( {
                saveLabel: "Create project",        
                title: "Choose new project location"
            })

            if (!newProjectRootUri) { return }    

            cwdPath = path.dirname(newProjectRootUri.fsPath)
            newProjectName = path.basename(newProjectRootUri.fsPath)
        }

        // const multilanguageResponse = await vscode.window.showQuickPick(["true", "false"],  {
        //     title: "Enable languages support?"
        // });

        // if (!multilanguageResponse) { return }


        WelcomeViewHelper.showProjectCreating()
        this._projectMapDataProvider.suspendProjectMapUpdates()

        await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Creating new project",
			cancellable: false
		},  async (progress, token) => {
            return new Promise<void>(async resolve => {
                
                progress.report({ message: "Creating dotnet project..."})

                const dotnetNew = async() => {
                        return await ChildProcessHelper.execute(
                        "dotnet", [ 
                            `new staticsharp`,
                            newProjectName ? ` -n "${newProjectName}"` : ``,
                            ` -vs true`
                        ], // -m ${multilanguageResponse} 
                        cwdPath
                    )}
                
                // TODO: execute "dotnet new uninstall" and parse output to check template version
                let executionResult = await dotnetNew()

                if (executionResult.exitCode === 103)
                {
                    progress.report({ message: "StaticSharp.Template missing, installing..."})
                    executionResult = await ChildProcessHelper.execute(
                        "dotnet",
                        ["new install StaticSharp.Templates"]
                    )

                    if (executionResult.exitCode === 0) {
                        progress.report({ message: "Retrying to create dotnet project..."})
                        executionResult = await dotnetNew()
                    }                    
                }

                // TODO: "dotnet restore" required to generate ProjectMap.json, but it works incorrect if project is in sub-folder
                if (executionResult.exitCode === 0)
                {
                    progress.report({ message: "Restoring dependencies..."})
                    executionResult = await ChildProcessHelper.execute(
                        "dotnet",
                        vscode.workspace.name ? ["restore"] : ["restore", newProjectName!],
                        cwdPath
                    )
                }

                if (executionResult.exitCode !== 0)
                {
                    vscode.window.showErrorMessage(`Failed to create project. 
                    Output: "${executionResult.output}"`, { modal: true })

                    WelcomeViewHelper.hideProjectCreating()  // TODO: this is a workaround (see other "hideProjectCreating" usage)
                } else if(!vscode.workspace.name) {
                    await vscode.commands.executeCommand("vscode.openFolder", newProjectRootUri)
                }

                this._projectMapDataProvider.unsuspendProjecMapUpdates()

                resolve()
			});
        })
    }
}