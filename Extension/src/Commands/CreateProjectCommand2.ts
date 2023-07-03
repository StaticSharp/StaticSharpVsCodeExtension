import * as fs from 'fs';
import * as vscode from 'vscode';
import path = require('path');
import { ChildProcessHelper } from '../Utilities/ChildProcessHelper';
import { ProjectMapDataProvider } from '../ProjectMapData/ProjectMapDataProvider';
import { WelcomeViewHelper } from '../Utilities/WelcomeViewHelper';

export class CreateProjectCommand2
{
    static readonly commandName = 'staticSharp.createProject'
    protected readonly templatesDir = ".\\StaticSharpVsCodeTemplates\\ProjectTemplates";

    protected _templatesDirAbsolute: string;

    constructor(
        extensionPath: string, 
        protected _projectMapDataProvider: ProjectMapDataProvider,
    ) {
        this._templatesDirAbsolute = path.resolve(extensionPath, this.templatesDir)
    }

    callback = async () => {
        // Select project template

        let dirItems = await vscode.workspace.fs.readDirectory(vscode.Uri.file(this._templatesDirAbsolute))
        let projectTemplates = dirItems.filter(di => di[1] === vscode.FileType.Directory).map(di => di[0])
        //let dirents = fs.readdirSync(this._templatesDirAbsolute, {withFileTypes : true})   
        //let projectTemplates = dirents.filter(de => de.isDirectory()).map(de => de.name)
        let selectedTemplate: string | undefined

        if (projectTemplates.length === 0) {
            throw new Error("No project templates found") // TODO: logging
        }
        else if (projectTemplates.length === 1)
        {
            selectedTemplate = projectTemplates[0]
        }
        else {
            selectedTemplate = await vscode.window.showQuickPick(projectTemplates,  {
                    title: "SelectProjectTemplate"
                });            
        }

        if (!selectedTemplate) { return }

        // Select new project dir and name

        let newProjectRootUri: vscode.Uri | undefined
        let cwdPath: string | undefined = vscode.workspace.workspaceFolders 
            ? vscode.workspace.workspaceFolders[0].uri.fsPath
            : undefined
        //let newProjectName: string | undefined

        if (!vscode.workspace.name) {
            newProjectRootUri = await vscode.window.showSaveDialog( {
                saveLabel: "Create project",        
                title: "Choose new project location"
            })

            if (!newProjectRootUri) { return }    

            cwdPath = path.dirname(newProjectRootUri.fsPath)
            
        } else {
            newProjectRootUri = vscode.workspace.workspaceFolders![0].uri
        }

        let newProjectName = path.basename(newProjectRootUri.fsPath)

        // Create new project

        WelcomeViewHelper.showProjectCreating()
            this._projectMapDataProvider.suspendProjectMapUpdates()

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Creating new project",
                cancellable: false
            },  async (progress, token) => {
                return new Promise<void>(async resolve => {
                    
                    progress.report({ message: "Creating dotnet project..."})

                    try {
                        this._projectMapDataProvider.suspendProjectMapUpdates()
                        //fs.copyFileSync(path.join(this._templatesDirAbsolute, selectedTemplate!), newProjectRootUri!.fsPath)
                        //fs.cpSync(path.join(this._templatesDirAbsolute, selectedTemplate!), newProjectRootUri!.fsPath)
                        // fs.renameSync(
                        //     path.join(newProjectRootUri!.fsPath, `${selectedTemplate!}.csproj`),
                        //     path.join(newProjectRootUri!.fsPath, `${newProjectName!}.csproj`),
                        // )
                        
                        await vscode.workspace.fs.copy(vscode.Uri.file(path.join(this._templatesDirAbsolute, selectedTemplate!)), newProjectRootUri!, {overwrite: true}) // TODO: overwrite
                        await vscode.workspace.fs.rename(
                            vscode.Uri.joinPath(newProjectRootUri!, `${selectedTemplate!}.csproj`), 
                            vscode.Uri.joinPath(newProjectRootUri!, `${newProjectName!}.csproj`))

                        //let currentDir = newProjectRootUri!
                        let replaceProjectNameInFiles = async (currentDir: vscode.Uri) => {
                            let dirItems = await vscode.workspace.fs.readDirectory(currentDir)
                            
                            let csFiles = dirItems.filter(di => di[1] === vscode.FileType.File 
                                && [".cs", ".json"].some(ext => ext === path.extname(di[0]))).map(di => di[0])
                            for (let file of csFiles) {
                                let fileUri = vscode.Uri.joinPath(currentDir, file)

                                let fileContent = await vscode.workspace.fs.readFile(fileUri)
                                let fileContentString = fileContent.toString()
                                
                                let newContentString = fileContentString.replaceAll(selectedTemplate!, newProjectName)
                                if (fileContentString !== newContentString) {
                                    let newContent = Buffer.from(newContentString)
                                    await vscode.workspace.fs.writeFile(fileUri, newContent)
                                }
                            }

                            let subDirectories = dirItems.filter(di => di[1] === vscode.FileType.Directory).map(di => di[0])
                            for (let subdirectory of subDirectories) {
                                let subDirectoryUri = vscode.Uri.joinPath(currentDir, subdirectory)
                                await replaceProjectNameInFiles(subDirectoryUri)
                            }
                        }

                        await replaceProjectNameInFiles(newProjectRootUri!)


                        progress.report({ message: "Restoring dependencies..."})
                        let executionResult = await ChildProcessHelper.execute(
                            "dotnet",
                            vscode.workspace.name ? ["restore"] : ["restore", newProjectName!],
                            cwdPath
                        )

                        if (executionResult.exitCode !== 0) {
                            throw new Error(`dotnet restore failure: "${executionResult.output}"`)
                        }
                        
                        if(!vscode.workspace.name) {
                            await vscode.commands.executeCommand("vscode.openFolder", newProjectRootUri)
                        } else {
                            // This is a workaround:
                            vscode.commands.executeCommand("workbench.files.action.refreshFilesExplorer") // needed to refresh Explorer
                            vscode.commands.executeCommand("routesExplorer.focus") // needed to return focus from Explorer
                        }

                    } catch (er) {
                        let errorMessage = "unknown"
                        if (er instanceof Error) {
                            errorMessage = er.message
                        }
                        
                        vscode.window.showErrorMessage(`Failed to create project. Error: "${errorMessage}"`, { modal: true })
                        WelcomeViewHelper.hideProjectCreating()
                    } finally {
                        this._projectMapDataProvider.unsuspendProjecMapUpdates()
                        resolve()
                    }
            })
        })
    }
}