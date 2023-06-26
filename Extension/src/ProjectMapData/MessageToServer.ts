export interface MessageToServer
{
    Type: MessageToServerType,
    Data?: string
}

export enum MessageToServerType
{
    projectMapRequest = 0,
    documentUpdatedEvent = 1,
    suspendProjectMapGeneration = 2,
}