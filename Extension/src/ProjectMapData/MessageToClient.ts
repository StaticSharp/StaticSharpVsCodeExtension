export interface MessageToClient
{
    Type: MessageToClientType,
    Data?: string
}

export enum MessageToClientType
{
    projectMap = 0,
}