import { PageTreeItem } from '../../Views/Pages/PageTreeItem';
import * as vscode from 'vscode';
import { ProjectMapDataProvider } from "../../ProjectMapData/ProjectMapDataProvider";
import { MultiEdit } from "../../Utilities/MultiEdit";
import { Mapper } from "../../Utilities/Mapper";
import path = require("path");
import { PageError } from '../../ProjectMapData/PageError';
import { AddPageCommand } from './AddPageCommand';
import { DeletePageCommand } from './DeletePageCommand';

export class FixPageCommand
{
    static readonly commandName = 'staticSharp.fixPage'

    constructor(
        protected _projectMapDataProvider: ProjectMapDataProvider
        ) { }
    
    callback = async (pageTreeItem: PageTreeItem) => {      
        // REFERENCES:
        // const referenceLocation = vscode.commands.executeCommand('vscode.executeReferenceProvider',
        //     Uri.file("D:\\GIT\\StaticSharpProjectMapGenerator\\TestProject\\Root\\Representative2.cs"),
        //     new vscode.Position(17, 69), // Position (line, column) of symbol find references for
        // )

        // referenceLocation.then((valRaw: any) => 
        //     {
        //         let val = valRaw as Array<vscode.Location>
        //         SimpleLogger.log(">>> " + val[0].uri)
        //         vscode.window.showInformationMessage("Yes")
        //     }
        // )

        let fixMessages: string[] = []
        let newPageName: string | undefined

        if (pageTreeItem.model.Errors.indexOf(PageError.pageNameNotMatchRouteName) >=0/* && 
            pageTreeItem.model.Errors.indexOf(PageError.multiplePagesPerFile) == -1 &&
            pageTreeItem.model.Errors.indexOf(PageError.syntaxErrors) == -1*/)
        {
            newPageName = await AddPageCommand.selectValidPageName(pageTreeItem.model.Route, this._projectMapDataProvider!.projectMap!.Languages)
            if (newPageName)
            {
                fixMessages.push(`Rename class "${pageTreeItem.model.Name}" to "${newPageName}"`)
            }
        }
            
        let finalPageName = newPageName ?? pageTreeItem.model.Name
        let properFilePath = path.join(this._projectMapDataProvider.projectMap!.PathToRoot,
            ...pageTreeItem.model.Route.RelativePathSegments,
            finalPageName + ".cs")

        if (pageTreeItem.model.FilePath !== properFilePath)
        {
            fixMessages.push(`Rename/move file "${pageTreeItem.model.FilePath}" to "${properFilePath}"`)
        }

        let fixSummaryMessage = "The following fixes will be done. Do you agree?"
        for (let fixMessage of fixMessages) {
            fixSummaryMessage += `\n- ${fixMessage}`
        }
        
        let userResponse = await vscode.window.showInformationMessage(fixSummaryMessage, { modal: true }, "Yes", "No")
        
        if (userResponse === "Yes") {
            MultiEdit.clearEdits()
            if (newPageName)
            {
                let descr = pageTreeItem.model.PageCsDescription
                const classNameRange = Mapper.toRange(descr.ClassName)
                MultiEdit.pushTextEdit(pageTreeItem.model.FilePath, new vscode.TextEdit(classNameRange, newPageName))
            }

            if (pageTreeItem.model.FilePath !== properFilePath)
            {
                MultiEdit.pushRenameEdit(pageTreeItem.model.FilePath, properFilePath)
            }

            await MultiEdit.applyEdits()
        }

        DeletePageCommand.proposeRemoveDirIfEmpty(vscode.Uri.file(path.dirname(pageTreeItem.model.FilePath)))
    }
}