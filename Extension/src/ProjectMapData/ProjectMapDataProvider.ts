import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ProjectMap } from './ProjectMap';
import { RouteMap } from './RouteMap';
import { PageMap } from './PageMap';


import { ChildProcess } from 'child_process';
import * as cross_spawn from 'cross-spawn';
import { SimpleLogger } from '../SimpleLogger';




export class ProjectMapDataProvider_old {
    
    protected _onProjectMapChanged: vscode.EventEmitter<undefined> = new vscode.EventEmitter<undefined>();
    readonly onProjectMapChanged: vscode.Event<undefined> = this._onProjectMapChanged.event;
    
    
    public projectMap: ProjectMap | undefined;
    public routesByPath = new Map<string, RouteMap>() // RelativePath:Route
    public pagesByFilePath = new Map<string, PageMap[]>() // Absolute file path: Pages[] (normally - single page)

    protected _projectMapFilePath?: string
    protected _watcher?: vscode.FileSystemWatcher;

    constructor(workspaceRoot?: string) {
        if (!workspaceRoot) {
            return
        }

        this._projectMapFilePath = path.join(workspaceRoot, "ProjectMap.json")
        
        // TODO: try node.js watcher: fs.FSWatcher
        this._watcher = vscode.workspace.createFileSystemWatcher(this._projectMapFilePath)
        
        this._watcher.onDidChange(uri => { 
            this.updateProjectMap()
        });

        this._watcher.onDidCreate(uri => { 
            this.updateProjectMap()
        });
    }

    public updateProjectMap()
    {
        if(this._projectMapFilePath && fs.existsSync(this._projectMapFilePath))
        {
            const file = fs.readFileSync(this._projectMapFilePath!, 'utf-8');
            let projectMap: ProjectMap = JSON.parse(file) // TODO: deserialize to a different model
            this.projectMap = projectMap
            
            this.routesByPath.clear()
            this.pagesByFilePath.clear()

            let fillSubRoutesIds = (currentRoute: RouteMap, currentRelativePathSegments: string[]) => 
            {
                currentRoute.RelativePathSegments = currentRelativePathSegments
                let relativePath = path.join(...currentRoute.RelativePathSegments)
                this.routesByPath.set(relativePath, currentRoute)

                for(let page of currentRoute.Pages)
                {                    
                    page.ExpectedFilePath = path.join(projectMap.PathToRoot, relativePath, page.Name) + ".cs"
                    page.Route = currentRoute

                    if (!this.pagesByFilePath.has(page.FilePath))
                    {
                        this.pagesByFilePath.set(page.FilePath, [page])
                    }
                    else
                    {
                        let pages = this.pagesByFilePath.get(page.FilePath)
                        pages!.push(page)
                    }
                }

                for(let childRoute of currentRoute.ChildRoutes)
                {
                    fillSubRoutesIds(childRoute, [...currentRoute.RelativePathSegments, childRoute.Name])
                }
            }
            
            fillSubRoutesIds(projectMap.Root, [projectMap.Root.Name])
        }

        this._onProjectMapChanged.fire(undefined);
    }

    dispose()
    {
        this._watcher?.dispose()
    }
}



export class ProjectMapDataProvider {
    
    
    
    public projectMap: ProjectMap | undefined;
    public routesByPath = new Map<string, RouteMap>() // RelativePath:Route
    public pagesByFilePath = new Map<string, PageMap[]>() // Absolute file path: Pages[] (normally - single page)

    protected _onProjectMapChanged: vscode.EventEmitter<undefined> = new vscode.EventEmitter<undefined>();
    readonly onProjectMapChanged: vscode.Event<undefined> = this._onProjectMapChanged.event;

    protected serverProcess?: ChildProcess;

    constructor(extensionPath: string, workspaceRoot?: string) {
        if (!workspaceRoot) {
            return
        }

        SimpleLogger.log(`>>> serverProcess`);
        SimpleLogger.log(`>>> ${!!this.serverProcess}`);
        if (this.serverProcess)
        {
            SimpleLogger.log(`>>> ${!this.serverProcess.connected}`);
            SimpleLogger.log(`>>> ${!this.serverProcess.killed}`);
            SimpleLogger.log(`>>> ${!this.serverProcess.exitCode}`);
        }

        if (!this.serverProcess || this.serverProcess.exitCode !== null) /* connected */
        {

            vscode.window.showInformationMessage("Path to exe: " + path.resolve(extensionPath, `.\\LanguageServerExecutable\\ProjectMapLanguageServer.exe`))

            this.serverProcess = cross_spawn.spawn(
                //`D:\\Git\\StaticSharpProjectMapVsCodeExtension\\ProjectMapLanguageServer\\bin\\Debug\\net7.0\\ProjectMapLanguageServer.exe`,
                path.resolve(extensionPath, `.\\LanguageServerExecutable\\ProjectMapLanguageServer.exe`),
                [workspaceRoot],
                {
                    //shell: true, // run not in a shell, because otherwise on exit shell (cmd) got killed, while service continues working
                    //cwd : `D:\\Git\\StaticSharpProjectMapVsCodeExtension\\ProjectMapLanguageServer\\bin\\Debug\\net7.0\\`
                    cwd: path.resolve(extensionPath, `.\\LanguageServerExecutable\\`)
                }
            )

            this.serverProcess.addListener('close', (code: number | null, signal: NodeJS.Signals | null) => {
                SimpleLogger.log(`>>> Server process close. code:${code} signal:${signal}`);
            })

            this.serverProcess.addListener('exit', (code: number | null, signal: NodeJS.Signals | null) => {
                SimpleLogger.log(`>>> Server process exit. code:${code} signal:${signal}`);
            })

            this.serverProcess.addListener('disconnect', () => {
                SimpleLogger.log(`>>> Server process disconnect.`);
            })

            this.serverProcess.addListener('error', (err: Error) => {
                SimpleLogger.log(`>>> Server process error. err.message:${err.message}`);
            })

            vscode.window.showInformationMessage("LS PID: " + this.serverProcess.pid)

            this.serverProcess.stdout!.on("data", (data: Buffer) => {
            // TODO: dedicated message type + versioning    
                let projectMap: ProjectMap
                try{
                    projectMap = JSON.parse(data.toString())
                } catch {
                    return
                }
                
                this.updateProjectMap(projectMap)
            });

            this.serverProcess.stderr!.on("data", (data: Buffer) => {
                vscode.window.showErrorMessage(data.toString());
            });

            
            vscode.workspace.onDidChangeTextDocument((e) => 
            {
                let fileUpdatedEvent = {
                    FileName : e.document.fileName,
                    HasUnsavedChanges : e.document.isDirty,
                    FileContent :  e.document.isDirty ? e.document.getText() : undefined
                }

                let outgoingMessage = 
                {
                    Type: 1,
                    Data: JSON.stringify(fileUpdatedEvent)
                };

                this.serverProcess!.stdin!.write(JSON.stringify(outgoingMessage) + "\n")
                
                //vscode.window.showInformationMessage(e.document.fileName)
            })
        }


        this.serverProcess!.stdin!.write(JSON.stringify({Type: 0}) + "\n")

        // this is for testing only
        // let intervalId = setInterval(() => {
        //     if (this.serverProcess)
        //     {
        //         this.serverProcess!.stdin!.write(JSON.stringify({type: 0}) + "\n")
        //     }
        //     //if(this.counter === 0) clearInterval(intervalId)
        // }, 5000)
    }

    

    protected updateProjectMap(projectMap: ProjectMap)
    {

        this.projectMap = projectMap
        
        this.routesByPath.clear()
        this.pagesByFilePath.clear()

        let fillSubRoutesIds = (currentRoute: RouteMap, currentRelativePathSegments: string[]) => 
        {
            currentRoute.RelativePathSegments = currentRelativePathSegments
            let relativePath = path.join(...currentRoute.RelativePathSegments)
            this.routesByPath.set(relativePath, currentRoute)

            for(let page of currentRoute.Pages)
            {                    
                page.ExpectedFilePath = path.join(projectMap.PathToRoot, relativePath, page.Name) + ".cs"
                page.Route = currentRoute

                if (!this.pagesByFilePath.has(page.FilePath))
                {
                    this.pagesByFilePath.set(page.FilePath, [page])
                }
                else
                {
                    let pages = this.pagesByFilePath.get(page.FilePath)
                    pages!.push(page)
                }
            }

            for(let childRoute of currentRoute.ChildRoutes)
            {
                fillSubRoutesIds(childRoute, [...currentRoute.RelativePathSegments, childRoute.Name])
            }
        }
        
        fillSubRoutesIds(projectMap.Root, [projectMap.Root.Name])
        this._onProjectMapChanged.fire(undefined);
    }

    dispose()
    {
        //this._watcher?.dispose()
        if (this.serverProcess)
        {
            // TODO: check if it works at all
            this.serverProcess.kill()
        }
    }
}