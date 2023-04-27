import path = require("path");
import * as vscode from 'vscode';
import { SimpleLogger } from "../../SimpleLogger";
import { TextEncoder } from "util";
import { RouteTreeItem } from "../../RoutesView/RouteTreeItem";
import { TreeView } from "vscode";
import { ProjectMapDataProvider } from "../../ProjectMapData/ProjectMapDataProvider";


export class AddPageCommand
{
    protected constructor() {}

    static projectMapDataProvider?: ProjectMapDataProvider // TODO: use dependency injection
    static routesTreeView?: TreeView<RouteTreeItem> // TODO: use dependency injection

    static commandName:string = 'staticSharp.addPage'
    static callback = async (treeItem? : RouteTreeItem) => {
        
        if (!this.routesTreeView || !this.projectMapDataProvider)
        {
            SimpleLogger.log(`ERROR: ${this.commandName} invoked but not initialized`)
            return
        }

        // TODO: is this a good way to select parent route?
        if (this.routesTreeView.selection.length !== 1 && !treeItem) { 
            vscode.window.showInformationMessage("Parent route for new page not selected")
            return 
        }

        const route = treeItem?.model || this.routesTreeView.selection[0].model

        const allValidPages = [route.Name, ...this.projectMapDataProvider!.projectMap!.Languages.slice(1).map(l => `${route.Name}_${l}`)]
        const missingPages = allValidPages.filter(vp => route.Pages.map(rp => rp.Name).indexOf(vp) === -1)

        let pageName : string | undefined

        if (missingPages.length === 0)
        {
            vscode.window.showInformationMessage("All valid pages already exist")
            return
        } else {
            pageName = await vscode.window.showQuickPick(missingPages,  {
                title: "Page name:"
            });
        }

        if (!pageName) { return }

        let pageType : string | undefined
        if (this.projectMapDataProvider.projectMap!.PageTypes.length === 1) {
            pageType = this.projectMapDataProvider.projectMap!.PageTypes[0]
        } else {
            pageType = await vscode.window.showQuickPick(this.projectMapDataProvider.projectMap!.PageTypes,  {
                title: "Page type:"
            });
        }

        if (pageType === undefined) { return }

        await this.addPageToRoute(route.RelativePathSegments, pageName, pageType)
    }

    public static async addPageToRoute(relativePathSegments : string[], pageName: string, pageType: string)
    {
        // TODO: DI!!!
        if (!this.routesTreeView || !this.projectMapDataProvider)
        {
            SimpleLogger.log(`ERROR: ${this.commandName} invoked but not initialized`)
            return
        }

        const newPageUri = vscode.Uri.file(path.join (
            this.projectMapDataProvider.projectMap!.PathToRoot, 
            ...relativePathSegments, 
            `${pageName}.cs`))

        const routeNs = [this.projectMapDataProvider.projectMap!.RootContaingNamespace, 
            ...relativePathSegments].join(".")
        const newPageCode = this.getNewPageCode(pageName, pageType, routeNs)
        await vscode.workspace.fs.writeFile(newPageUri, new TextEncoder().encode(newPageCode))

        // TODO: append code formatting?

        await vscode.commands.executeCommand("vscode.open", newPageUri)
    }

    // TODO: snippet? dotnet new?
    protected static getNewPageCode = (pageName: string, pageType: string, routeNs: string) => `
using StaticSharp;

namespace ${routeNs} {

    [Representative]
    public class ${pageName} : ${pageType} {

    }
}`

}