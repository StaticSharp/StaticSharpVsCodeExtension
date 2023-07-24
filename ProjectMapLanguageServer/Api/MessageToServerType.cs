namespace ProjectMapLanguageServer.Api {
    public enum MessageToServerType {
        ProjectMapRequest = 0,
        DocumentUpdatedEvent = 1,
        SuspendProjectMapGeneration = 2,
        SetLogLevel = 3,
        GetNewPageSourceCode = 4
    }
}
