import * as vscode from 'vscode';
import { RouteTreeItem as RouteTreeItem } from './RouteTreeItem';
import { MoveRouteCommand } from './Commands/MoveRouteCommand';

export class RoutesTreeDndController implements vscode.TreeDragAndDropController<RouteTreeItem> {
    protected readonly _routesExplorerMimeType = "application/vnd.code.tree.routesExplorer"

    dropMimeTypes: readonly string[] = [this._routesExplorerMimeType];
    dragMimeTypes: readonly string[] = [this._routesExplorerMimeType];


    async handleDrag(source: readonly RouteTreeItem[], dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken) : Promise<void> {
        dataTransfer.set(this._routesExplorerMimeType, new vscode.DataTransferItem(source[0].model.RelativePathSegments))
    }

    async handleDrop(target: RouteTreeItem | undefined, dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken) : Promise<void> {
        if (!target)
        {
            return;
        }

        const transferItem = dataTransfer.get(this._routesExplorerMimeType)
        if (!transferItem) {
			return;
		}

        const sourceRelativePathSegments: string[] = transferItem.value
        vscode.commands.executeCommand(MoveRouteCommand.commandName, sourceRelativePathSegments, 
            [...target?.model.RelativePathSegments, sourceRelativePathSegments[sourceRelativePathSegments.length-1]])
    }
}