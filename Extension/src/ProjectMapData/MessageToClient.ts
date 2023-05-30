export interface MessageToClient
{
    Type: MessageToClientType,
    Data?: string
}

export enum MessageToClientType
{
    projectMap = 0,
    logMessage = 1
}