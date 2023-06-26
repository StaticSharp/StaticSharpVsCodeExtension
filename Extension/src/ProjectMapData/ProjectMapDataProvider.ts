import * as vscode from 'vscode';
import * as path from 'path';
import { ProjectMap } from './LanguageServerContract/ProjectMap';
import { RouteMap } from './LanguageServerContract/RouteMap';
import { PageMap } from './LanguageServerContract/PageMap';


import { ChildProcess } from 'child_process';
import * as cross_spawn from 'cross-spawn';
import { LogLevel, SimpleLogger } from '../SimpleLogger';
import { DocumentUpdatedEvent } from './LanguageServerContract/DocumentUpdatedEvent';
import { MessageToServer, MessageToServerType } from './MessageToServer';
import { MessageToClient, MessageToClientType } from './MessageToClient';
import { InitializationProgressHelper } from '../Utilities/InitilizationProgressHelper';
import { LogMessage } from './LanguageServerContract/LogMessage';


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
            InitializationProgressHelper.hideProgress()
            return
        }

        this.setUpLanguageServer()
        
        this.sendMessageToServer(MessageToServerType.projectMapRequest)

        // Files monitoring needed only to handle unsaved changes. Changes in filesystem will be captured be language server
        vscode.workspace.onDidChangeTextDocument(evt => {
            if (evt.document.uri.scheme === "file" && path.extname(evt.document.uri.fsPath) === ".cs")
            {
                let documentUpdatedEvent : DocumentUpdatedEvent = {
                    FileName : evt.document.fileName,
                    FileContent :  evt.document.isDirty ? evt.document.getText() : undefined
                }
    
                this.sendMessageToServer(MessageToServerType.documentUpdatedEvent, JSON.stringify(documentUpdatedEvent))
            }
        })
    }

    suspendProjecMapUpdates()
    {
        this.sendMessageToServer(MessageToServerType.suspendProjectMapGeneration, undefined)
    }

    unsuspendProjecMapUpdates()
    {
        this.sendMessageToServer(MessageToServerType.projectMapRequest, undefined)
    }

    protected setUpLanguageServer()
    {
        let languageServerAbsolutePath = path.resolve(this.extensionPath, this.languageServerRelativePath)
        let params = [this.workspaceRoot!, SimpleLogger.logLevel.toString()]

        this.serverProcess = cross_spawn.spawn(
            languageServerAbsolutePath,
            params,
            {
                //shell: true, // run not in a shell, because otherwise on exit shell (cmd) got killed, while service continues working
                cwd: path.dirname(languageServerAbsolutePath)
            }
        )

        this.serverProcess.stdout!.on("data", (data: Buffer) => {
            let rawMessages = data.toString().replace(/\r/g, "\n").split("\n").filter(p => p !== "") // replace(/.../g) === replaceAll(...)

            for (let rawMessage of rawMessages)
            {
                try{
                    let message: MessageToClient = JSON.parse(rawMessage)                    
                    switch(message.Type)
                    {
                        case MessageToClientType.projectMap:
                            SimpleLogger.log(`>>Srv>>>projectMap: Data:${message.Data}`, LogLevel.debug)    
                            let projectMap: ProjectMap | undefined
                            projectMap = message.Data ? JSON.parse(message.Data) : undefined
                            this.updateProjectMap(projectMap)
                            InitializationProgressHelper.hideProgress()
                            break;
                        
                        case MessageToClientType.logMessage:
                            let logMessage: LogMessage | undefined
                            logMessage = message.Data ? JSON.parse(message.Data) : undefined
                            if (!logMessage) {
                                throw new Error("Empty log message")
                            }

                            SimpleLogger.log(`>>Srv>>>logMessage: ${logMessage.Message}`, logMessage.LogLevel)
                            break;
                    }
                } catch {
                    SimpleLogger.log(`>>Srv: ${rawMessage}`)
                    continue
                }
            }
        });

        this.serverProcess.stderr!.on("data", (data: Buffer) => {
            vscode.window.showErrorMessage(data.toString(), { modal: true });
        });
        
        this.serverProcess.addListener('close', (code: number | null, signal: NodeJS.Signals | null) => {
            SimpleLogger.log(`Server process close. code:${code} signal:${signal}`);
        })

        this.serverProcess.addListener('exit', (code: number | null, signal: NodeJS.Signals | null) => {
            SimpleLogger.log(`Server process exit. code:${code} signal:${signal}`);
        })

        this.serverProcess.addListener('error', (err: Error) => {
            SimpleLogger.log(`Server process error. err.message:${err.message}`);
        })


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
        // TODO: use suspendProjecMapUpdates()
        for(let uri of dirtyUris)
        {
            vscode.workspace.openTextDocument(uri.fsPath).then(doc => {
                let documentUpdatedEvent : DocumentUpdatedEvent = {
                    FileName : uri.fsPath,
                    FileContent :  doc.getText()
                }

                this.sendMessageToServer(MessageToServerType.documentUpdatedEvent, JSON.stringify(documentUpdatedEvent))
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

        const messageString = JSON.stringify(outgoingMessage)
        SimpleLogger.log(`>>ToSrv: ${messageString}`, LogLevel.debug)
        this.serverProcess!.stdin!.write(messageString + "\n")
    }

    protected updateProjectMap(projectMap?: ProjectMap)
    {
        this.projectMap = projectMap
        
        this.routesByPath.clear()
        this.pagesByFilePath.clear()

        if (projectMap)
        {
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
        //this._watcher?.dispose()
        if (this.serverProcess)
        {
            // TODO: check if it works at all
            this.serverProcess.kill()
        }
    }
}