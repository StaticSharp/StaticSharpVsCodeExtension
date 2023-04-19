/// Page model in imported json
interface PageMap
{
    RelativePathSegments: string[]  // TODO: now calculated in ts, maybe optmize - calc RelativePath in advance
    Name: string
    Debug: string
    ChildPages: PageMap[]
    Representatives: RepresentativeMap[]
    //PathSegments: string[]
    //ResourceFiles: string[]
}