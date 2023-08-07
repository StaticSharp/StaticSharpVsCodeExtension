using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using ProjectMapLanguageServer.Core.ContractModels;
using ProjectMapLanguageServer.Core.SourcesAnalysis;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace ProjectMapLanguageServer.Core
{
    /// <summary>
    /// Generates ProjectMap (now main part of ProjectMap - TODO:)
    /// </summary>

    public class ProjectMapFactory
    {
        protected StaticSharpSymbols _staticSharpSymbols { get; set; }

        public ProjectMapFactory(StaticSharpSymbols pagesFinder) {
            _staticSharpSymbols = pagesFinder;
        }

        public ProjectMap CreateProjectMap(Compilation compilation, string pathToProject)
        {
            // determine root
            var pathToRoot = Path.Combine(Path.GetDirectoryName(pathToProject)!, _staticSharpSymbols.RelativePathToRoot);

            var rootContainingNamespaceNameLength = _staticSharpSymbols.RootNamespaceFullName.LastIndexOf(".");
            var rootContainingNamespaceName = 
                _staticSharpSymbols.RootNamespaceFullName.Substring(0, rootContainingNamespaceNameLength);
            var rootNamespaceShortName =
                _staticSharpSymbols.RootNamespaceFullName.Substring(rootContainingNamespaceNameLength + 1);

            var projectMap = new ProjectMap(compilation.AssemblyName, rootNamespaceShortName, pathToRoot, rootContainingNamespaceName);            

            // find representatives
            var allSymbols = compilation.GetSymbolsWithName(_ => true);
            var typeSymbols = allSymbols.OfType<INamedTypeSymbol>();
            var allPages = typeSymbols.Where(ts => _staticSharpSymbols.IsPage(ts) && _staticSharpSymbols.IsPageRepresentative(ts));

            // construct tree
            foreach (var pageSymbol in allPages) {
                var currentNamespace = pageSymbol.ContainingNamespace;
                var pageContainerFullyQualifiedName = pageSymbol.ContainingNamespace?.GetFullyQualifiedNameNoGlobal();
                if (pageContainerFullyQualifiedName == null) continue; // TODO: in is impliend that symbol container is namespace, not class
                if (!pageContainerFullyQualifiedName.StartsWith(_staticSharpSymbols.RootNamespaceFullName)) continue; // Pages not under Root are ignored
                var pageContainerPathFromRoot = pageContainerFullyQualifiedName.Substring(rootContainingNamespaceNameLength + 1);
                var pagePathSegments = pageContainerPathFromRoot.Split(".");


                // TODO: relative? partial?

                var filePath = pageSymbol.DeclaringSyntaxReferences.First().GetSyntax().SyntaxTree.FilePath;

                if (string.IsNullOrEmpty(pageSymbol.Name)) {
                    // TODO: realy strange hack: this code never executes,
                    // though without it Name=="" in a specific case: when appending chars to it's end without saving
                    Console.WriteLine(JsonSerializer.Serialize(pageSymbol));
                }

                var route = projectMap.GetOrCreateRouteByPath(pagePathSegments);
                route.Pages.Add(new PageMap
                {
                    Name = pageSymbol.Name,
                    FilePath = filePath,
                    PageCsDescription = CreatePageCsDescription(pageSymbol),

                    ExpectedFilePath = Path.Combine(projectMap.PathToRoot, Path.Combine(pagePathSegments.ToArray()), $"{pageSymbol.Name}.cs"),
                    Route = route,
                    RoslynSymbol = pageSymbol
                });
            }

            projectMap.ProjectCsDescription = CreateProjectCsDescription(compilation, projectMap);

            return projectMap;
        }

        protected PageCsDescription CreatePageCsDescription(INamedTypeSymbol pageSymbol)
        {
            var classSyntaxReference = pageSymbol.DeclaringSyntaxReferences.First();

            var fileSyntaxNode = classSyntaxReference.SyntaxTree.GetRoot();

            var classSyntaxNode = classSyntaxReference.GetSyntax();
            var className = classSyntaxNode.ChildTokens().First(_ => _.IsKind(SyntaxKind.IdentifierToken));
            //declarationSyntaxNode.GetAnnotatedTokens("")

            var exclusiveWrapper = GetExclusiveWrapper(classSyntaxNode);

            var result = new PageCsDescription {
                ClassDefinition = classSyntaxNode.ToFileTextRange(),
                ClassName = className.ToFileTextRange(),
                ProposedDefinitionLine = fileSyntaxNode.LineSpan().EndLinePosition.Line + 1,
                ProposedDefinitionColumn = 0,

                FileScopedNamespace = null,

                ExclusiveNamespaceWrapper = exclusiveWrapper.ToFileTextRange()
            };

            return result;
        }

        protected SyntaxNode GetExclusiveWrapper(SyntaxNode target) {
            var sibblings = target.Parent.ChildNodes();
            var firstSibbling = sibblings.First();
            if (sibblings.Count() == 2 && ( 
                firstSibbling.IsKind(SyntaxKind.IdentifierName) || // Single namepace
                firstSibbling.IsKind(SyntaxKind.QualifiedName) )) // Dot separated multiple namespaces
            {
                return GetExclusiveWrapper(target.Parent);
            } else {
                return target;
            }
        }
    
        protected ProjectCsDescription CreateProjectCsDescription(Compilation compilation, ProjectMap projectMap)
        {
            List<FileTextRange> GetSyntaxNodeNsRanges(NamespaceDeclarationSyntax node)
            {
                // TODO: support file-scoped namespaces
                var childNodes = node.ChildNodes();
                var ranges = new List<FileTextRange> { childNodes.First(n => n.IsKind(SyntaxKind.QualifiedName) || n.IsKind(SyntaxKind.IdentifierName)).ToFileTextRange() };
                ranges = ranges.Concat(childNodes.
                    Where(n => n.IsKind(SyntaxKind.NamespaceDeclaration)).
                    Select(ns => GetSyntaxNodeNsRanges((NamespaceDeclarationSyntax)ns)).
                    SelectMany(x => x)).ToList();

                return ranges;
            }

            var result = new ProjectCsDescription();

            //TODO: exclude Root neighbors
            foreach( var syntaxTree in compilation.SyntaxTrees.Where(st => st.FilePath.StartsWith(projectMap.PathToRoot))) {
                var relativePath = syntaxTree.FilePath.Substring(projectMap.PathToRoot.Length+1); // +1 for path separator

                var currentNamespaceNodes = syntaxTree.GetRoot().ChildNodes().Where(n => n.IsKind(SyntaxKind.NamespaceDeclaration));
                var namespaceRanges = currentNamespaceNodes.Select(n => GetSyntaxNodeNsRanges((NamespaceDeclarationSyntax)n)).SelectMany(x => x);

                result.NamespacesDeclarations[relativePath] = namespaceRanges;
            }

            return result;
        }
    }       

    

}
