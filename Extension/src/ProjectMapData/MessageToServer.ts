export interface MessageToServer
{
    RequestId? : string,
    Type: MessageToServerType,
    Data?: string
}

export enum MessageToServerType
{
    projectMapRequest = 0,
    documentUpdatedEvent = 1,
    suspendProjectMapGeneration = 2,
    setLogLevel = 3, // TODO: not implemented
    getNewPageCode = 4
}