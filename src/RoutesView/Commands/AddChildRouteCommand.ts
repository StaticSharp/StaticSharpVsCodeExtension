import path = require("path");
import * as vscode from 'vscode';
import { SimpleLogger } from "../../SimpleLogger";
import { ProjectMapDataProvider } from "../../ProjectMapData/ProjectMapDataProvider";
import { RouteTreeItem } from "../RouteTreeItem";
import { TextEncoder } from "util";
import { AddPageCommand } from "../../PagesView/Commands/AddPageCommand";


export class AddChildRouteCommand
{
    protected constructor() {}

    static projectMapDataProvider?: ProjectMapDataProvider // TODO: use dependency injection
    //static routesTreeView?: TreeView<RouteTreeItem> // TODO: use dependency injection

    static commandName:string = 'staticSharp.addChildRoute'
    static callback = async (treeItem: RouteTreeItem) => {
        
        if (!this.projectMapDataProvider)
        {
            SimpleLogger.log(`ERROR: ${this.commandName} invoked but not initialized`)
            return
        }

        // if (this.routesTreeView.selection.length != 1) return

        // const routeTreeItem = this.routesTreeView.selection[0]

        const routeName = await vscode.window.showInputBox({
            value: "",
            title: "Route name:",
            placeHolder: '<Route name>',
            validateInput: text => {
                if (text === "") { return "Name must not be empty" }
                if (text.indexOf("/")>-1 || text.indexOf("\\")>-1 || text.indexOf(".")>-1) {
                    return 'Name cannot contain ".", "\\", "/"' }
                return null
            }
        });

        if (routeName === undefined) { return }

        let pageType : string | undefined
        if (this.projectMapDataProvider.projectMap!.PageTypes.length === 1) {
            pageType = this.projectMapDataProvider.projectMap!.PageTypes[0]
        } else {
            pageType = await vscode.window.showQuickPick(this.projectMapDataProvider.projectMap!.PageTypes,  {
                title: "Page type:"
            });
        }

        if (pageType === undefined) { return }

        await AddPageCommand.addPageToRoute([...treeItem.model.RelativePathSegments, routeName], routeName, pageType)
    }
}