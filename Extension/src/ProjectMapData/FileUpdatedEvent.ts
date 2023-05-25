export interface FileUpdatedEvent
{
    FileName: string
    FileContent?: string
    HasUnsavedChanges: Boolean
}