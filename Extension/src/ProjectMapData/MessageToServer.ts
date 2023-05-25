export interface MessageToServer
{
    Type: MessageToServerType,
    Data?: string
}

export enum MessageToServerType
{
    projectMapRequest = 0,
    fileUpdatedEvent = 1
}