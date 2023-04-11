import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class ProjectMapDataProvider {
    
    private _onProjectMapChanged: vscode.EventEmitter<undefined> = new vscode.EventEmitter<undefined>();
    readonly onProjectMapChanged: vscode.Event<undefined> = this._onProjectMapChanged.event;
    
    
    public projectMap: ProjectMap | undefined;
    public pagesMap = new Map<string, PageMap>() // Id:Page

    protected _projectMapFilePath?: string
    protected _watcher?: vscode.FileSystemWatcher;

    constructor(private workspaceRoot?: string) {
        if (!workspaceRoot) {
            vscode.window.showInformationMessage('No dependency in empty workspace');
            return
        }

        this._projectMapFilePath = path.join(workspaceRoot, "ProjectMap.json")

        if(fs.existsSync(this._projectMapFilePath))
        {
            this.updatePageMap()
        }
        
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
        const file = fs.readFileSync(this._projectMapFilePath!, 'utf-8');
        let projectMap: ProjectMap = JSON.parse(file) // TODO: deserialize to a different model
        this.projectMap = projectMap
        
        this.pagesMap.clear()

        let fillSubPagesIds = (rootPage: PageMap) => 
        {
            for(let page of rootPage.ChildPages)
            {
                page.RelativePath = path.join(rootPage.RelativePath, page.Name) // `${rootPage.Id}.${page.Name}`
                this.pagesMap.set(page.RelativePath, page)

                for(let representative of page.Representatives)
                {                    
                    representative.ExpectedFilePath = path.join(projectMap.PathToRoot, page.RelativePath, representative.Name) + ".cs"

                    // if (representative.ExpectedFilePath != representative.FilePath)
                    // {
                    //     vscode.window.showInformationMessage(`Incomsistent paths. Suggested: "${representative.ExpectedFilePath}" Actual: "${representative.FilePath}" `)
                    // }
                }

                fillSubPagesIds(page)
            }
        }
        
        projectMap.Root.RelativePath = projectMap.Root.Name
        fillSubPagesIds(projectMap.Root)
        // end

        this._onProjectMapChanged.fire(undefined);
    }

}