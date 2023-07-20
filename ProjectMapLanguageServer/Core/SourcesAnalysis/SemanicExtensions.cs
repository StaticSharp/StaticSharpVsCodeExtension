using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ProjectMapLanguageServer.Core.SourcesAnalysis
{
    public static class SemanicExtensions
    {
        public static bool IsDescendantOf(this INamedTypeSymbol typeSymbol, INamedTypeSymbol ancestorCandidate) =>
            typeSymbol.BaseType != null &&
            (SymbolEqualityComparer.Default.Equals(typeSymbol.BaseType, ancestorCandidate)
            || typeSymbol.BaseType.IsDescendantOf(ancestorCandidate));


        // !!! Copied from RoutingSg.Helpers.SymbolHelper
        public static string GetFullyQualifiedNameNoGlobal(this ISymbol x) {
            var format = SymbolDisplayFormat.FullyQualifiedFormat;
            format = format.WithGlobalNamespaceStyle(SymbolDisplayGlobalNamespaceStyle.Omitted);
            var resut = x.ToDisplayString(format);

            return resut;

        }
    }
}
