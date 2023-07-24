namespace ProjectMapLanguageServer.Api
{
    public class MessageToClient
    {
        public string? ResponseToRequestId { get; set; }

        public MessageToClientType? Type { get; set; } // TODO: message has Type, request has ResponseToRequestId

        public string? Data { get; set; }
    }
}
