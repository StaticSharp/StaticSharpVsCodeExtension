using Microsoft.CodeAnalysis;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ProjectMapSg.SourcesAnalysis
{
    public class StaticSharpSymbols
    {
        protected Compilation _compilation { get; set; }

        public StaticSharpSymbols(Compilation compilation)
        {
            _compilation = compilation;
        }

        protected INamedTypeSymbol _primalPageSymbol;
        public INamedTypeSymbol PrimalPage => _primalPageSymbol = _primalPageSymbol ??
            _compilation.GetTypesByMetadataName("StaticSharp.Page").Single();

        INamedTypeSymbol _protonode;
        public INamedTypeSymbol Protonode => _protonode = _protonode ??
            _compilation.GetSymbolsWithName("ProtoNode").OfType<INamedTypeSymbol>().SingleOrDefault();

        protected List<INamedTypeSymbol> _primalPageDescendants { get; set; }
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


        INamedTypeSymbol _languageEnum;
        bool _languageEnumWasSearched = false;
        public INamedTypeSymbol LanguageEnum
        {
            get
            {
                if (!_languageEnumWasSearched)
                {
                    var multilanguageProtonode = _compilation.GetTypesByMetadataName("StaticSharp.MultilanguageProtoNode`1").Single();

                    var currentProtonodeAncestor = Protonode.BaseType;
                    while (currentProtonodeAncestor != null)
                    {
                        if (SymbolEqualityComparer.Default.Equals(currentProtonodeAncestor.ConstructedFrom, multilanguageProtonode))
                        {
                            _languageEnum = currentProtonodeAncestor.TypeArguments.First() as INamedTypeSymbol;
                            break;
                        }

                        currentProtonodeAncestor = currentProtonodeAncestor.BaseType;
                    }

                    _languageEnumWasSearched = true;
                }

                return _languageEnum;
            }
        }
    }
}
