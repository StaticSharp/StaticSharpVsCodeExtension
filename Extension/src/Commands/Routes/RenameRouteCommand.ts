import * as vscode from 'vscode';
import { RouteTreeItem } from '../../Views/Routes/RouteTreeItem';
import { TreeView } from "vscode";
import { MoveRouteCommand } from "./MoveRouteCommand";

export class RenameRouteCommand
{
    static readonly commandName = 'staticSharp.renameRoute'

    constructor(
        protected _routesTreeView: TreeView<RouteTreeItem>,
    ) {}

    callback = async () => {
        if (this._routesTreeView.selection.length !== 1) { return }

        const routeTreeItem = this._routesTreeView.selection[0]
        const result = await vscode.window.showInputBox({
            value: routeTreeItem.model.Name,
            valueSelection: [0, -1],
            placeHolder: '<New name>',
            validateInput: text => {
                if (text === "") { return "Name must not be empty" }
                if (text.indexOf("/")>-1 || text.indexOf("\\")>-1 || text.indexOf(".")>-1) {
                    return 'Name cannot contain ".", "\\", "/"' }
                return null
            }
        });

        if (result !== undefined)
        {
            routeTreeItem.model.RelativePathSegments
            vscode.commands.executeCommand(MoveRouteCommand.commandName, routeTreeItem.model.RelativePathSegments, 
                [...routeTreeItem.model.RelativePathSegments.slice(0, routeTreeItem.model.RelativePathSegments.length-1), result])
        }
    }
}