using Microsoft.CodeAnalysis;
using ProjectMapSg.ContractModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ProjectMapSg
{
    public static class StaticSharpProjectValidator
    {
        static public void Validate(ProjectMap projectMap, Compilation compilation)
        {
            List<PageMap> GetAllDescendingPages(RouteMap route)
            {
                var childRoutePages = route.ChildRoutes.SelectMany(cr => GetAllDescendingPages(cr));
                return route.Pages.Concat(childRoutePages).ToList();
            }

            var allPages = GetAllDescendingPages(projectMap.Root);
            //var allSyntaxErrors = compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error);
            //var filesWithErrors = allSyntaxErrors.Select(e => e.Location.SourceTree.FilePath);

            foreach (var page in allPages)
            {
                page.Errors = new List<PageError>();

                //if (filesWithErrors.Contains(page.FilePath))
                //{
                //    page.Errors.Add(PageError.SyntaxErrors);
                //}

                var pageValidNames = projectMap.Languages.Select(l => $"{page.Route.Name}_{l}").ToList().Append(page.Route.Name);
                if (!pageValidNames.Contains(page.Name)) {
                    page.Errors.Add(PageError.PageNameNotMatchRouteName);
                }

                if (page.ExpectedFilePath != page.FilePath) {
                    page.Errors.Add(PageError.LocationNotMatchDefinition);
                }

                if (page.RoslynSymbol.DeclaringSyntaxReferences.Count() > 1) { // this is possible if there are multiple partial definitions
                    page.Errors.Add(PageError.PageHasMultipleDefinitionParts);
                }

                if (allPages.Count(p => p.FilePath == page.FilePath) > 1) {
                    page.Errors.Add(PageError.MultiplePagesPerFile);
                }

                var relativeFilePath = page.FilePath.Substring(projectMap.PathToRoot.Length + 1); // TODO: it should be relative everywhere
                if (projectMap.ProjectCsDescription.NamespacesDeclarations[relativeFilePath].Count() > 1) {
                    page.Errors.Add(PageError.MultiupleNamespacesPerFile);
                }
            }
        }
    }
}
