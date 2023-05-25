import * as vscode from 'vscode';
import * as path from 'path';
import { ProjectMap } from './ProjectMap';
import { RouteMap } from './RouteMap';
import { PageMap } from './PageMap';


import { ChildProcess } from 'child_process';
import * as cross_spawn from 'cross-spawn';
import { SimpleLogger } from '../SimpleLogger';
import { FileUpdatedEvent } from './FileUpdatedEvent';
import { MessageToServer, MessageToServerType } from './MessageToServer';


export class ProjectMapDataProvider {
    public projectMap: ProjectMap | undefined;
    public routesByPath = new Map<string, RouteMap>() // RelativePath:Route
    public pagesByFilePath = new Map<string, PageMap[]>() // Absolute file path: Pages[] (normally - single page)

    protected _onProjectMapChanged: vscode.EventEmitter<undefined> = new vscode.EventEmitter<undefined>();
    readonly onProjectMapChanged: vscode.Event<undefined> = this._onProjectMapChanged.event;

    protected serverProcess?: ChildProcess;

    //protected extensionPath: string;
    protected readonly languageServerRelativePath = ".\\LanguageServerExecutable\\ProjectMapLanguageServer.exe";

    constructor(protected extensionPath: string, protected workspaceRoot?: string) {
        this.extensionPath = extensionPath;

        if (!workspaceRoot) {
            return
        }

        this.setUpLanguageServer()
        
        this.sendMessageToServer(MessageToServerType.projectMapRequest)

        // Files monitoring needed only to handle unsaved changes. Changes in filesystem will be captured be language server
        vscode.workspace.onDidChangeTextDocument(evt => {
            let fileUpdatedEvent : FileUpdatedEvent = {
                FileName : evt.document.fileName,
                HasUnsavedChanges : evt.document.isDirty,
                FileContent :  evt.document.isDirty ? evt.document.getText() : undefined
            }

            this.sendMessageToServer(MessageToServerType.fileUpdatedEvent, JSON.stringify(fileUpdatedEvent))
        })
    }

    protected setUpLanguageServer()
    {
        let languageServerAbsolutePath = path.resolve(this.extensionPath, this.languageServerRelativePath)

        this.serverProcess = cross_spawn.spawn(
            languageServerAbsolutePath,
            [this.workspaceRoot!],
            {
                //shell: true, // run not in a shell, because otherwise on exit shell (cmd) got killed, while service continues working
                cwd: path.dirname(languageServerAbsolutePath)
            }
        )

        this.serverProcess.addListener('close', (code: number | null, signal: NodeJS.Signals | null) => {
            SimpleLogger.log(`>>> Server process close. code:${code} signal:${signal}`);
        })

        this.serverProcess.addListener('exit', (code: number | null, signal: NodeJS.Signals | null) => {
            SimpleLogger.log(`>>> Server process exit. code:${code} signal:${signal}`);
        })

        this.serverProcess.addListener('error', (err: Error) => {
            SimpleLogger.log(`>>> Server process error. err.message:${err.message}`);
        })

        this.serverProcess.stdout!.on("data", (data: Buffer) => {
            // TODO: review this, maybe suppress foreign messages somehow?
            var rawMessages = data.toString().split("\r\n")
            for (let rawMessage of rawMessages)
            {
                let projectMap: ProjectMap
                try{
                    projectMap = JSON.parse(rawMessage)
                    this.updateProjectMap(projectMap)
                } catch {
                    return
                }
            }
        });

        this.serverProcess.stderr!.on("data", (data: Buffer) => {
            vscode.window.showErrorMessage(data.toString());
        });

               // this is needed in case when we have to restart language server
        let dirtyUris: vscode.Uri[] = []
        for(let tabgroup of vscode.window.tabGroups.all) {
            for (let tab of tabgroup.tabs) {
                if (tab.isDirty 
                    && tab.input instanceof vscode.TabInputText 
                    && [".cs", ".csproj"].some(ext => ext === path.extname((tab.input as vscode.TabInputText).uri.fsPath))
                    && dirtyUris.every(du => du !== (tab.input as vscode.TabInputText).uri)) {
                        let uri = (tab.input as vscode.TabInputText).uri
                        dirtyUris.push(uri)
                    }
            }
        }

        // TODO: this is suboptimal - need to send in a batch, than generate and process project map only once
        for(let uri of dirtyUris)
        {
            vscode.workspace.openTextDocument(uri.fsPath).then(doc => {
                let fileUpdatedEvent : FileUpdatedEvent = {
                    FileName : uri.fsPath,
                    HasUnsavedChanges : true,
                    FileContent :  doc.getText()
                }

                this.sendMessageToServer(MessageToServerType.fileUpdatedEvent, JSON.stringify(fileUpdatedEvent))
            })
        }
            
    }

    protected sendMessageToServer(messageType: MessageToServerType, messageData?: string)
    {
        if (!this.serverProcess || this.serverProcess.exitCode)
        {
            vscode.window.showWarningMessage("Language server is down, restarting...")
            this.setUpLanguageServer()
        }
        
        let outgoingMessage: MessageToServer = 
        {
            Type: messageType,
            Data: messageData
        };

        this.serverProcess!.stdin!.write(JSON.stringify(outgoingMessage) + "\n")
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