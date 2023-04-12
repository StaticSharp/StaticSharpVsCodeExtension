import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class ProjectMapDataProvider {
    
    private _onProjectMapChanged: vscode.EventEmitter<undefined> = new vscode.EventEmitter<undefined>();
    readonly onProjectMapChanged: vscode.Event<undefined> = this._onProjectMapChanged.event;
    
    
    public projectMap: ProjectMap | undefined;
    public pagesMap = new Map<string, PageMap>() // RelativePath:Page

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
            this.updatePageMap()
        });

        this._watcher.onDidCreate(uri => { 
            this.updatePageMap()
        });

        //this.watcher.dispose(); // TODO: ????
    }

    public updatePageMap()
    {
        if(this._projectMapFilePath && fs.existsSync(this._projectMapFilePath))
        {
            const file = fs.readFileSync(this._projectMapFilePath!, 'utf-8');
            let projectMap: ProjectMap = JSON.parse(file) // TODO: deserialize to a different model
            this.projectMap = projectMap
            
            this.pagesMap.clear()

            let fillSubPagesIds = (currentPage: PageMap, currentRelativePath: string) => 
            {
                currentPage.RelativePath = currentRelativePath
                this.pagesMap.set(currentPage.RelativePath, currentPage)

                for(let childPage of currentPage.ChildPages)
                {
                    fillSubPagesIds(childPage, path.join(currentPage.RelativePath, childPage.Name))
                    for(let representative of childPage.Representatives)
                    {                    
                        representative.ExpectedFilePath = path.join(projectMap.PathToRoot, childPage.RelativePath, representative.Name) + ".cs"
                    }
                }
            }
            
            fillSubPagesIds(projectMap.Root, projectMap.Root.Name)
        }

        this._onProjectMapChanged.fire(undefined);
    }

}