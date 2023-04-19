interface FileTextRange
{
    filePath: string // TODO: optimize, it will be dublicated
    
    start: number
    startLine: number
    startColumn: number
    
    end: number
    endLine: number
    endColumn: number
}