import * as vscode from 'vscode';
import * as fs from 'fs';

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

        this._projectMapFilePath = workspaceRoot + "\\ProjectMap.json" // TODO: Path.combine

        if(fs.existsSync(this._projectMapFilePath))
        {
            vscode.window.showInformationMessage("File exists")
            this.updatePageMap()
        }

        //this.watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(workspaceRoot,  "ProjectMap.json"))
        this._watcher = vscode.workspace.createFileSystemWatcher(this._projectMapFilePath)
        vscode.window.showInformationMessage("Watcher created")
        
        this._watcher.onDidChange(uri => { 
            vscode.window.showInformationMessage("Change detected")
            this.updatePageMap()
        });

        this._watcher.onDidCreate(uri => { 
            vscode.window.showInformationMessage("Create detected")
            this.updatePageMap()
        });

        //this.watcher.dispose(); // TODO: ????
    }

    public updatePageMap()
    {
        const file = fs.readFileSync(this._projectMapFilePath!, 'utf-8');
        //vscode.window.showInformationMessage(file)
        let projectMap: ProjectMap = JSON.parse(file)
        this.projectMap = projectMap
        
        this.pagesMap.clear()

        // TODO: likely pass from code generator OR add additional data layer: one json Page, the other - processed Page
        let fillSubPagesIds = (rootPage: PageMap) => 
        {
            for(let page of rootPage.ChildPages)
            {
                page.Id = `${rootPage.Id}.${page.Name}`
                this.pagesMap.set(page.Id, page)
                fillSubPagesIds(page)
            }
        }
        
        projectMap.Root.Id = projectMap.Root.Name
        fillSubPagesIds(projectMap.Root)
        // end

        this._onProjectMapChanged.fire(undefined);
    }

}