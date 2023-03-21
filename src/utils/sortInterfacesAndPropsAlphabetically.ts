import * as ts from 'typescript';

export function sortInterfacesAndPropsAlphabetically(sourceCode: string): string {
  const sourceFile = ts.createSourceFile(
    'temp.ts',
    sourceCode,
    ts.ScriptTarget.ESNext,
    true
  );

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  const transformationContext = {
    factory: ts.factory,
    enableEmitNotification: false,
    enableSubstitution: false,
    endLexicalEnvironment: () => [],
    getCompilerOptions: () => ({}),
    hoistFunctionDeclaration: () => {},
    hoistVariableDeclaration: () => {},
    onError: () => {},
    startLexicalEnvironment: () => {},
  };

  const visit = (node: ts.Node): ts.Node => {
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

    return ts.visitEachChild(node, visit, transformationContext);
  };

  const updatedSourceFile = ts.visitNode(sourceFile, visit);
  return printer.printNode(ts.EmitHint.Unspecified, updatedSourceFile, sourceFile);
}
