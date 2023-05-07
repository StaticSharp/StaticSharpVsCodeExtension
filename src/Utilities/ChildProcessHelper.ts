import * as vscode from 'vscode';
import * as cross_spawn from 'cross-spawn';

export interface ExecutionResult
{
    exitCode?: number
    output: string
}

export class ChildProcessHelper
{
    protected constructor() {}    

    static async execute(command: string, args: ReadonlyArray<string>, cwd?: string) : Promise<ExecutionResult>
    {
        let resolveResult: (value: ExecutionResult) => void
        const resultPromise = new Promise<ExecutionResult>(resolve => {
            resolveResult = resolve
        });

        let childProcess = cross_spawn.spawn(
            command,
            args,
            {
                shell: true, // without shell nothing works
                cwd : cwd
            }
        )

        let output = "";
        childProcess.stdout!.on("data", (data: Buffer) => {
          output += data
        });
        childProcess.stderr!.on("data", (data: Buffer) => {
          output += data
        });

        childProcess.on('exit', (exitCode: number) => {
            resolveResult({
                exitCode : exitCode,
                output : output.trim()
            })
        });

        childProcess.on('error', (err: Error) => {
            resolveResult({
                exitCode : undefined,
                output : err.message
            })
        });

        return resultPromise
    }
}

