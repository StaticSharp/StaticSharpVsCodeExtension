namespace ProjectMapLanguageServer.Api
{
    internal class MessageToServer
    {
        public string? RequestId { get; set; } // TODO: class RequestToServer : MessageToServer?

        public MessageToServerType Type { get; set; }

        public string? Data { get; set; }
    }
}
