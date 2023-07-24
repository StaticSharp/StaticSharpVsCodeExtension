using Microsoft.CodeAnalysis;
using static ProjectMapLanguageServer.Core.Queries.GetNewPageSourceCode;

namespace ProjectMapLanguageServer.Core.Queries {
    
    /// <summary>
    /// Constructs a C# code for a new StaticSharp page
    /// </summary>
    public class GetNewPageSourceCode {

        protected ProjectMapBuilder _projectMapBuilder { get; }

        static class Templates {
            public static string PageName = "`ClassName";

            public static string RouteName = "`NamespaceName";

            public static string PageType = "`ClassType";

            public static string DefaultPage = $@"
using StaticSharp;

namespace {RouteName} {{

    public partial class {PageName} : {PageType} {{

    }}
}}
";
        }
        

        public class Input {
            public string PageShortName { get; init; }
            public string PageParentTypeFullName { get; init; }
            public string RouteNamespace { get; init; }
        }
            

        public GetNewPageSourceCode(ProjectMapBuilder projectMapBuilder) {
            _projectMapBuilder = projectMapBuilder;
        }

        public string Execute(Input input) {
            var parentSymbol = _projectMapBuilder.Compilation?.GetTypeByMetadataName(input.PageParentTypeFullName) ?? 
                throw new Exception($"Parent type not found: {input.PageParentTypeFullName}");
            
            var templateAttribute = parentSymbol.GetAttributes().FirstOrDefault(a => a.AttributeClass?.Name == "TemplateAttribute" /*TODO move to StaticSharpConventions*/);
            var templateString = templateAttribute?.ConstructorArguments.FirstOrDefault().Value as string; // OrDefault() - in case of syntax error

            templateString = templateString ?? Templates.DefaultPage;

            var result = templateString
                .Replace(Templates.PageName, input.PageShortName)
                .Replace(Templates.RouteName, input.RouteNamespace)
                .Replace(Templates.PageType, input.PageParentTypeFullName);

            return result;
        }
    }
}
