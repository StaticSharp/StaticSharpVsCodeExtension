import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class ProjectMapDataProvider {
    
    private _onProjectMapChanged: vscode.EventEmitter<undefined> = new vscode.EventEmitter<undefined>();
    readonly onProjectMapChanged: vscode.Event<undefined> = this._onProjectMapChanged.event;
    
    
    public projectMap: ProjectMap | undefined;
    public routesMap = new Map<string, RouteMap>() // RelativePath:Route

    protected _projectMapFilePath?: string
    protected _watcher?: vscode.FileSystemWatcher;

    constructor(private workspaceRoot?: string) {
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

        //this.watcher.dispose(); // TODO: ????
    }

    public updateProjectMap()
    {
        if(this._projectMapFilePath && fs.existsSync(this._projectMapFilePath))
        {
            const file = fs.readFileSync(this._projectMapFilePath!, 'utf-8');
            let projectMap: ProjectMap = JSON.parse(file) // TODO: deserialize to a different model
            this.projectMap = projectMap
            
            this.routesMap.clear()

            let fillSubRoutesIds = (currentRoute: RouteMap, currentRelativePathSegments: string[]) => 
            {
                currentRoute.RelativePathSegments = currentRelativePathSegments
                let relativePath = path.join(...currentRoute.RelativePathSegments)
                this.routesMap.set(relativePath, currentRoute)

                vscode.window.showInformationMessage(JSON.stringify(currentRoute.Pages))
                for(let page of currentRoute.Pages)
                {                    
                    page.ExpectedFilePath = path.join(projectMap.PathToRoot, relativePath, page.Name) + ".cs"
                    page.Route = currentRoute
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

}