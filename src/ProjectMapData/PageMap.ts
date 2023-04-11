/// Page model in imported json
interface PageMap
{
    RelativePath: string // TODO: now calculated in ts
    Name: string
    Debug: string
    ChildPages: PageMap[]
    Representatives: RepresentativeMap[]
    //ResourceFiles: string[]
}