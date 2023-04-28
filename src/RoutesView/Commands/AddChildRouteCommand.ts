import * as vscode from 'vscode';
import { ProjectMapDataProvider } from "../../ProjectMapData/ProjectMapDataProvider";
import { RouteTreeItem } from "../RouteTreeItem";
import { AddPageCommand } from "../../PagesView/Commands/AddPageCommand";

export class AddChildRouteCommand
{
    static readonly commandName = 'staticSharp.addChildRoute'

    constructor(
        protected _projectMapDataProvider: ProjectMapDataProvider,
    ) {}

    callback = async (treeItem: RouteTreeItem) => {
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
        if (this._projectMapDataProvider.projectMap!.PageTypes.length === 1) {
            pageType = this._projectMapDataProvider.projectMap!.PageTypes[0]
        } else {
            pageType = await vscode.window.showQuickPick(this._projectMapDataProvider.projectMap!.PageTypes,  {
                title: "Page type:"
            });
        }

        if (pageType === undefined) { return }

        await AddPageCommand.addPageToRoute(this._projectMapDataProvider, [...treeItem.model.RelativePathSegments, routeName], routeName, pageType)
    }
}