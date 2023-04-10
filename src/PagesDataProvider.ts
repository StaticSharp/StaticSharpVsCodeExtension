import * as vscode from 'vscode';
import * as fs from 'fs';
import { PageTreeItem } from './Models/PageTreeItem';

export class PagesDataProvider implements vscode.TreeDataProvider<PageTreeItem> {
    
    private _onDidChangeTreeData: vscode.EventEmitter<PageTreeItem | undefined | null | void> = new vscode.EventEmitter<PageTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<PageTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
    
    public watcher?: vscode.FileSystemWatcher;

    public projectMap: ProjectMap | undefined;
    public pagesMap = new Map<string, PageMap>()

    constructor(private workspaceRoot?: string) {
        if (!workspaceRoot) {
            vscode.window.showInformationMessage('No dependency in empty workspace');
            return
        }

        let projectMapFilePath = workspaceRoot + "\\ProjectMap.json"

        if(fs.existsSync(projectMapFilePath))
        {
            vscode.window.showInformationMessage("File exists")
            this.updatePageMap(projectMapFilePath)
        }

        //this.watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(workspaceRoot,  "ProjectMap.json"))
        this.watcher = vscode.workspace.createFileSystemWatcher(projectMapFilePath)
        vscode.window.showInformationMessage("Watcher created")
        
        this.watcher.onDidChange(uri => { 
            vscode.window.showInformationMessage("Change detected")
            this.updatePageMap(projectMapFilePath)
        });

        this.watcher.onDidCreate(uri => { 
            vscode.window.showInformationMessage("Create detected")
            this.updatePageMap(projectMapFilePath)
        });

        //this.watcher.dispose(); // TODO: ????

        
    }

    updatePageMap(filePath: string)
    {
        const file = fs.readFileSync(filePath, 'utf-8');
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

        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(treeItem: PageTreeItem): vscode.TreeItem {
        return treeItem;
    }

    getChildren(treeItem?: PageTreeItem): PageTreeItem[] {
        if (treeItem) {
            return treeItem.model.ChildPages.map(c => new PageTreeItem(c)).
                sort((a,b) => a.model.Name > b.model.Name ? 1 : a.model.Name==b.model.Name? 0: -1)
        } else {
            return this.projectMap ? [new PageTreeItem(this.projectMap.Root)] : []
        }
    }
}