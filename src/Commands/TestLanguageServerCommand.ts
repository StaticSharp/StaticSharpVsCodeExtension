import * as vscode from 'vscode';
import * as cross_spawn from 'cross-spawn';
import { ChildProcess } from 'child_process';

export class TestLanguageServerCommand
{
    static serverProcess: ChildProcess

    static readonly commandName = 'staticSharp.testLanguageServerCommand'
    callback = async () => {
        if (!TestLanguageServerCommand.serverProcess || TestLanguageServerCommand.serverProcess.exitCode !== null) /* connected */
        {
            TestLanguageServerCommand.serverProcess = cross_spawn.spawn(
                //`C:\\POC\\ProjectMapWorkerService\\bin\\Release\\net6.0\\ProjectMapWorkerService.exe`,
                `C:\\POC\\ProjectMapLanguageServer\\bin\\Release\\net6.0\\ProjectMapLanguageServer.exe`,
                [],
                {
                    //shell: true, // run not in a shell, because otherwise on exit shell (cmd) got killed, while service continues working
                    cwd : `C:\\POC\\ProjectMapLanguageServer\\bin\\Release\\net6.0\\`
                }
            )

            //let output = "";
            TestLanguageServerCommand.serverProcess.stdout!.on("data", (data: Buffer) => {
                //output += data
                vscode.window.showInformationMessage(data.toString());
            });
            TestLanguageServerCommand.serverProcess.stderr!.on("data", (data: Buffer) => {
                //output += data
                vscode.window.showInformationMessage(data.toString());
            });

            
            vscode.workspace.onDidChangeTextDocument((e) => 
            {
                vscode.window.showInformationMessage(e.document.fileName)
            })

            // var fsWatcher1 = vscode.workspace.createFileSystemWatcher("c:\\Repos\\ProjectMapSg\\TestProject\\Root\\About\\Resource1.txt")
            // var fsWatcher2 = vscode.workspace.createFileSystemWatcher('c:\\Repos\\ProjectMapSg\\TestProject\\ProjectMap.json')
            
            
            // fsWatcher1.onDidChange(uri => { 
            //     vscode.window.showInformationMessage("YES1")
            // });
    
            // fsWatcher2.onDidChange(uri => { 
            //     vscode.window.showInformationMessage("YES2")
            // });

        }
        
        TestLanguageServerCommand.serverProcess.stdin!.write("qwerty\n")
        
    }
}