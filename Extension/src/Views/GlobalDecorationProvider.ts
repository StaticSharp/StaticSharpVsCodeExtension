import {window, Tab, TabInputText, Uri, Disposable, Event, EventEmitter, FileDecoration, FileDecorationProvider, ThemeColor} from 'vscode';
import * as vscode from 'vscode';


export class GlobalDecorationProvider implements FileDecorationProvider {

    public static get singleton()
    {
        if (!this._singleton)
        {
            this._singleton = new GlobalDecorationProvider()
        }
        
        return this._singleton
    }

    protected static _singleton: GlobalDecorationProvider 

    private readonly _onDidChangeFileDecorations: EventEmitter<Uri | Uri[]> = new EventEmitter< Uri | Uri[]>();
    readonly onDidChangeFileDecorations: Event<Uri | Uri[]> = this._onDidChangeFileDecorations.event;

    protected constructor() {}  // Singleton

    protected decorationBuffer: Map<string, FileDecoration | undefined> = new Map;

    updateDecoration(uri:Uri, decoration: FileDecoration | undefined)
    {
        this.decorationBuffer.set(uri.toString(), decoration)
        this._onDidChangeFileDecorations.fire(uri)
    }

    async provideFileDecoration(uri: Uri): Promise<FileDecoration | undefined> {
        const uriString = uri.toString()
        const bufferedDecoration = this.decorationBuffer.get(uriString)
        this.decorationBuffer.delete(uriString)
        return bufferedDecoration
    }

}