import * as vscode from 'vscode';
import { TextEncoder } from "util";
import { TreeView } from "vscode";
import { ProjectMapDataProvider } from "../../ProjectMapData/ProjectMapDataProvider";
import path = require('path');
import { RouteTreeItem } from '../../Views/Routes/RouteTreeItem';
import { RouteMap } from '../../ProjectMapData/LanguageServerContract/RouteMap';

export class AddPageCommand
{
    static readonly commandName = 'staticSharp.addPage'

    constructor(
        protected _projectMapDataProvider: ProjectMapDataProvider,
        protected _routesTreeView: TreeView<RouteTreeItem>
    ) {}

    callback = async (treeItem? : RouteTreeItem) => {
        if (!(treeItem instanceof RouteTreeItem)) // TODO: somehow it could be PageTreeItem
        {
            treeItem = undefined
        }
        
        // TODO: is this a good way to select parent route?
        if (this._routesTreeView.selection.length !== 1 && !treeItem) { 
            vscode.window.showInformationMessage("Parent route for new page not selected", { modal: true })
            return 
        }

        const route = treeItem?.model || this._routesTreeView.selection[0].model


        const pageName = await AddPageCommand.selectValidPageName(route, this._projectMapDataProvider!.projectMap!.Languages)

        if (!pageName) { return }

        let pageType : string | undefined
        if (this._projectMapDataProvider.projectMap!.PageTypes.length === 1) {
            pageType = this._projectMapDataProvider.projectMap!.PageTypes[0]
        } else {
            pageType = await vscode.window.showQuickPick(this._projectMapDataProvider.projectMap!.PageTypes,  {
                title: "Page type:"
            });
        }

        if (pageType === undefined) { return }

        await AddPageCommand.addPageToRoute(this._projectMapDataProvider, route.RelativePathSegments, pageName, pageType)
    }

    public static async addPageToRoute(projectMapDataProvider : ProjectMapDataProvider, relativePathSegments : string[], pageName: string, pageType: string)
    {
        const newPageUri = vscode.Uri.file(path.join (
            projectMapDataProvider.projectMap!.PathToRoot, 
            ...relativePathSegments, 
            `${pageName}.cs`))

        const routeNs = [projectMapDataProvider.projectMap!.RootContaingNamespace, 
            ...relativePathSegments].join(".")
        const newPageCode = this.getNewPageCode(pageName, pageType, routeNs)
        await vscode.workspace.fs.writeFile(newPageUri, new TextEncoder().encode(newPageCode))

        // TODO: append code formatting?

        await vscode.commands.executeCommand("vscode.open", newPageUri)
    }

    // TODO: move out. dotnet new?
    static getNewPageCode = (pageName: string, pageType: string, routeNs: string) => `
using StaticSharp;

namespace ${routeNs} {

    [Representative]
    public partial class ${pageName} : ${pageType} {

    }
}`

    static async selectValidPageName(route: RouteMap, languages: string[]) : Promise<string | undefined>
    {
        const allValidPages = [route.Name, ...languages.slice(1).map(l => `${route.Name}_${l}`)]
        const missingPages = allValidPages.filter(vp => route.Pages.map(rp => rp.Name).indexOf(vp) === -1)

        let pageName : string | undefined

        if (missingPages.length === 0)
        {
            vscode.window.showInformationMessage("All valid pages already exist", { modal: true })
        } else {
            pageName = await vscode.window.showQuickPick(missingPages,  {
                title: "Page name:"
            });
        }

        return pageName
    }
}