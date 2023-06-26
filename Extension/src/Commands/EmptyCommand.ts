
/**
 * Does nothing. Used for TreeView: if command is set for TreeItem, than it doesn't expand/collapse on click (command is executed instead and should control expand/collapse)
 */
export class EmptyCommand
{
    static readonly commandName = 'staticSharp.emptyCommand'
    callback = async () => {}
}