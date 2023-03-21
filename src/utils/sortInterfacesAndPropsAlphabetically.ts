import * as ts from 'typescript';

export function sortInterfacesAndPropsAlphabetically(sourceCode: string): string {
  const sourceFile = ts.createSourceFile(
    'temp.ts',
    sourceCode,
    ts.ScriptTarget.ESNext,
    true
  );

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    const visit: ts.Visitor = (node) => {
      if (ts.isInterfaceDeclaration(node)) {
        const sortedMembers = node.members.slice().sort((a, b) => {
          if (ts.isPropertySignature(a) && ts.isPropertySignature(b)) {
            const aName = a.name.getText(sourceFile);
            const bName = b.name.getText(sourceFile);
            return aName.localeCompare(bName);
          }
          return 0;
        });

        return ts.factory.updateInterfaceDeclaration(
          node,
          node.decorators,
          node.modifiers,
          node.name,
          node.typeParameters,
          node.heritageClauses,
          sortedMembers
        );
      }

      return ts.visitEachChild(node, visit, context);
    };

    return (sourceFile) => ts.visitNode(sourceFile, visit);
  };

  //usar uma função de transformação e passar o contexto que é fornecido

  const result = ts.transform(sourceFile, [transformer]);
  const transformedSourceFile = result.transformed[0] as ts.SourceFile;

  return printer.printNode(ts.EmitHint.Unspecified, transformedSourceFile, sourceFile);
}
