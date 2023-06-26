/**
 * Notifies Language server that document has updated and now it has unsaved changes (or it did have and now it does not)
 */
export interface DocumentUpdatedEvent
{
    FileName: string
    FileContent?: string
}