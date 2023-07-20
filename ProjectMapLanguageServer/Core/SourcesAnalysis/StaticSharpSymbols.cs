using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace ProjectMapLanguageServer.Core.SourcesAnalysis
{
    public class StaticSharpSymbols
    {
        protected Compilation _compilation { get; set; }

        public StaticSharpSymbols(Compilation compilation)
        {
            _compilation = compilation;
        }

        protected INamedTypeSymbol? _primalPageSymbol;

        public bool IsStaticSharpCoreReferenced { 
            get {
                try {
                    var temp = PrimalPage;
                    return true;
                } catch { 
                    return false; 
                }
            }
        }

        public INamedTypeSymbol PrimalPage => _primalPageSymbol = _primalPageSymbol ??
            _compilation.GetTypesByMetadataName("StaticSharp.Page").Single();

        INamedTypeSymbol? _protonode;
        public INamedTypeSymbol Protonode => _protonode = _protonode ??
            _compilation.GetTypeByMetadataName("StaticSharp.MultilanguageProtoNode`1") ??
            throw new Exception("Protonode not found");

        protected List<INamedTypeSymbol>? _primalPageDescendants { get; set; }
        public List<INamedTypeSymbol> PrimalPageDescendants
        {
            get
            {
                if (_primalPageDescendants == null)
                {

                    var pagePossibleParents = new List<INamedTypeSymbol>();
                    var allSymbols = _compilation.GetSymbolsWithName(_ => true);
                    var typeSymbols = allSymbols.OfType<INamedTypeSymbol>();
                    foreach (var typeSymbol in typeSymbols)
                    {
                        if (typeSymbol.IsDescendantOf(PrimalPage))
                        {
                            pagePossibleParents.Add(typeSymbol);
                        }
                    }

                    _primalPageDescendants = pagePossibleParents;
                }

                return _primalPageDescendants;
            }
        }

        public bool IsPage(ISymbol s) =>
            s is INamedTypeSymbol &&
            ((INamedTypeSymbol)s).IsDescendantOf(PrimalPage) &&
            ((INamedTypeSymbol)s).DeclaringSyntaxReferences.Any( // TODO: unify with RoutingSg.SymbolHelper.IsPartial
                sr => (sr.GetSyntax() as TypeDeclarationSyntax)?.Modifiers.Any(
                    m => m.IsKind(Microsoft.CodeAnalysis.CSharp.SyntaxKind.PartialKeyword))
                == true) &&
            !((INamedTypeSymbol)s).IsStatic;

        /// <summary>
        /// Checks that symbol is "representative" (impying we already know that symbol is "page")
        /// </summary>
        /// <param name="pageSymbol">Page symbol</param>
        /// <returns></returns>
        public bool IsPageRepresentative(ISymbol pageSymbol) =>
            !pageSymbol.IsAbstract;


        public string RootNamespaceFullName => $"{_compilation.AssemblyName}.Root";

        /// <summary>
        /// Directory name for Root directory. Relative to project (workspace) directory
        /// </summary>
        public string RelativePathToRoot => $""; // NOTE: this not necessirily match with RootNamespaceFullName


        protected INamedTypeSymbol? _languageEnum;
        public INamedTypeSymbol LanguageEnum => _languageEnum ?? 
            _compilation.GetTypeByMetadataName($"{RootNamespaceFullName}.Language") ??
            throw new Exception("Language not found");
    }
}
