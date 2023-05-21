using Microsoft.CodeAnalysis;
using ProjectMapSg.ContractModels;
using System;
using System.Collections.Generic;
using System.Text;

namespace ProjectMapSg.SourcesAnalysis
{
    public static class SyntaxExtensions
    {
        public static FileLinePositionSpan LineSpan(this SyntaxNode node) => node.SyntaxTree.GetLineSpan(node.Span);

        public static FileTextRange ToFileTextRange(this SyntaxNode node)
        {
            var lineSpan = node.LineSpan();
            return new FileTextRange
            {
                StartLine = lineSpan.StartLinePosition.Line,
                StartColumn = lineSpan.StartLinePosition.Character,
                EndLine = lineSpan.EndLinePosition.Line,
                EndColumn = lineSpan.EndLinePosition.Character
            };
        }


        public static FileLinePositionSpan LineSpan(this SyntaxReference node) => node.SyntaxTree.GetLineSpan(node.Span);

        public static FileTextRange ToFileTextRange(this SyntaxReference node)
        {
            var lineSpan = node.LineSpan();
            return new FileTextRange
            {
                StartLine = lineSpan.StartLinePosition.Line,
                StartColumn = lineSpan.StartLinePosition.Character,
                EndLine = lineSpan.EndLinePosition.Line,
                EndColumn = lineSpan.EndLinePosition.Character
            };
        }


        public static FileLinePositionSpan LineSpan(this SyntaxToken node) => node.SyntaxTree.GetLineSpan(node.Span);

        public static FileTextRange ToFileTextRange(this SyntaxToken node)
        {
            var lineSpan = node.LineSpan();
            return new FileTextRange
            {
                StartLine = lineSpan.StartLinePosition.Line,
                StartColumn = lineSpan.StartLinePosition.Character,
                EndLine = lineSpan.EndLinePosition.Line,
                EndColumn = lineSpan.EndLinePosition.Character
            };
        }

    }
}
