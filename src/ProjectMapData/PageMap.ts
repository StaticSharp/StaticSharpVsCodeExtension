/// Page model in imported json
interface PageMap
{
    Id: string // TODO: now calculated in ts
    Name: string
    Debug: string
    ChildPages: PageMap[]
    Representatives: RepresentativeMap[]
    //ResourceFiles: string[]
}