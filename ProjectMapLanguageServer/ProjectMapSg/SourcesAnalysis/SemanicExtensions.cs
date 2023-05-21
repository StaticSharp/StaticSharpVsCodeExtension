using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ProjectMapSg.SourcesAnalysis
{
    public static class SemanicExtensions
    {
        public static bool IsDescendantOf(this INamedTypeSymbol typeSymbol, INamedTypeSymbol ancestorCandidate) =>
            typeSymbol.BaseType != null &&
            (SymbolEqualityComparer.Default.Equals(typeSymbol.BaseType, ancestorCandidate)
            || typeSymbol.BaseType.IsDescendantOf(ancestorCandidate));
    }
}
