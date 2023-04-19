/// Page model in imported json
interface RepresentativeMap
{
    Name: string
    Route: PageMap // calculated
    FilePath: string
    ExpectedFilePath: string // TODO: now calculated in ts, relative to Root

    RepresentativeCsDescription: RepresentativeCsDescription // TODO: rename to nullable FixNamespaceProposal ?
}