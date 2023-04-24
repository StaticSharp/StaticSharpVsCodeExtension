import path = require("path");
import { ProjectMapDataProvider } from "../../ProjectMapData/ProjectMapDataProvider"
import { SimpleLogger } from "../../SimpleLogger"
import * as vscode from 'vscode';
import { MultiEdit } from "../../Utilities/MultiEdit";
import { Mapper } from "../../Utilities/Mapper";
import { RouteTreeItem } from "../RouteTreeItem";
import { RoutesDataProvider } from "../RoutesDataProvider";
import { TreeView } from "vscode";
import { MoveRouteCommand } from "./MoveRouteCommand";

export class RenameRouteCommand
{
    protected constructor() {}

    static routesTreeView?: TreeView<RouteTreeItem> // TODO: use dependency injection

    static commandName:string = 'staticSharp.renameRoute'
    static callback = async () => {
        if (!this.routesTreeView)
        {
            SimpleLogger.log(`ERROR: ${this.commandName} invoked but not initialized`)
            return
        }

        if (this.routesTreeView.selection.length != 1) return

        const routeTreeItem = this.routesTreeView.selection[0]
        const result = await vscode.window.showInputBox({
            value: routeTreeItem.model.Name,
            valueSelection: [0, -1],
            placeHolder: '<New name>',
            validateInput: text => {
                if (text === "") return "Name must not be empty"
                if (text.indexOf("/")>-1 || text.indexOf("\\")>-1 || text.indexOf(".")>-1)
                    return 'Name cannot contain ".", "\\", "/"'
                return null
            }
        });

        if (result != undefined)
        {
            routeTreeItem.model.RelativePathSegments
            vscode.commands.executeCommand(MoveRouteCommand.commandName, routeTreeItem.model.RelativePathSegments, 
                [...routeTreeItem.model.RelativePathSegments.slice(0, routeTreeItem.model.RelativePathSegments.length-1), result])
        }
    }
}