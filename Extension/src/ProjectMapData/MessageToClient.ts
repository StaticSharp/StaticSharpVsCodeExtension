export interface MessageToClient
{
    ResponseToRequestId? : string
    Type: MessageToClientType,
    Data?: string
}

export enum MessageToClientType
{
    projectMap = 0,
    logMessage = 1
}