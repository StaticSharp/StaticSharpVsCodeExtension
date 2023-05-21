using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using ProjectMapSg.ContractModels;
using ProjectMapSg.SourcesAnalysis;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace ProjectMapSg
{
    public class PageTreeFactory
    {
        protected StaticSharpSymbols _staticSharpSymbols { get; set; }

        public PageTreeFactory(StaticSharpSymbols pagesFinder) {
            _staticSharpSymbols = pagesFinder;
        }

        public ProjectMap CreatePageTree(Compilation compilation) // TODO: review ProjectMap vs PageTree
        {
            // finding root (by protonode)

            if (_staticSharpSymbols.Protonode == null) {
                throw new Exception("ProtoNode not found or multiple ProtoNode's"); // TODO: notify user of exceptions
            }

            var rootNamespace = _staticSharpSymbols.Protonode.ContainingNamespace;
            // TODO: relative? partial?
            var rootFilePath = _staticSharpSymbols.Protonode.DeclaringSyntaxReferences.First().GetSyntax().SyntaxTree.FilePath;
            var pathToRoot = Path.GetDirectoryName(Path.GetDirectoryName(rootFilePath));  // TODO: remove this from others files names?

            var rootContainingNamespaces = new List<string>();
            if (!rootNamespace.IsGlobalNamespace) {
                var currentOuterNamespace = rootNamespace.ContainingNamespace;
                while (!currentOuterNamespace.IsGlobalNamespace) {
                    rootContainingNamespaces.Add(currentOuterNamespace.Name);
                    currentOuterNamespace = currentOuterNamespace.ContainingNamespace;
                }
            }

            rootContainingNamespaces.Reverse();
            var rootContainingNamespaceString = string.Join(".", rootContainingNamespaces);
            var projectMap = new ProjectMap(compilation.AssemblyName, rootNamespace.Name, pathToRoot, rootContainingNamespaceString);            

            // find representatives
            var pageSymbols = _staticSharpSymbols.PrimalPageDescendants.Where(_ => _.GetAttributes()
                .Any(__ => __.AttributeClass.ConstructedFrom.ToString() == "StaticSharp.RepresentativeAttribute"));

            // construct tree
            foreach (var pageSymbol in pageSymbols) {
                var currentNamespace = pageSymbol.ContainingNamespace;

                IEnumerable<string> pagePathSegments = new List<string>();

                while (!SymbolEqualityComparer.Default.Equals(currentNamespace, rootNamespace)) {
                    pagePathSegments = pagePathSegments.Prepend(currentNamespace.Name);

                    if (string.IsNullOrEmpty(currentNamespace.Name) && !currentNamespace.IsGlobalNamespace) {
                        // TODO: realy strange hack: this code never executes,
                        // though without it Name=="" in a specific case: when appending chars to it's end without saving
                        Console.WriteLine(JsonSerializer.Serialize(currentNamespace));
                    }

                    currentNamespace = currentNamespace.ContainingNamespace;

                    if (currentNamespace == null) {
                        break;
                    }
                }
                
                if (currentNamespace == null) {
                    // TODO: notify user
                    SimpleLogger.Log($"WARNING: Page not under root. Page type: {pageSymbol.Name}");
                    break;
                }

                pagePathSegments = pagePathSegments.Prepend(rootNamespace.Name);

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
