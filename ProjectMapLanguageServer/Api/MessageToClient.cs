namespace ProjectMapLanguageServer.Api
{
    public class MessageToClient
    {
        public string? ResponseToRequestId { get; set; }

        public MessageToClientType? Type { get; set; } // TODO: message has Type, response has ResponseToRequestId - split into two classes?

        public string? Data { get; set; }
    }
}
