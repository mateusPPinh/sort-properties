import * as ts from 'typescript';

export function sortInterfacesAndPropsAlphabetically(sourceCode: string, fileName: string): string {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceCode,
    ts.ScriptTarget.ESNext,
    true
  );

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    const visit: ts.Visitor = (node) => {
      if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
        const sortedMembers = sortTypeMembers(node, sourceFile);
        return updateTypeNode(node, sortedMembers);
      }

      return ts.visitEachChild(node, visit, context);
    };

    return (sourceFile) => ts.visitNode(sourceFile, visit);
  };

  const result = ts.transform(sourceFile, [transformer]);
  const transformedSourceFile = result.transformed[0] as ts.SourceFile;

  return printer.printNode(ts.EmitHint.Unspecified, transformedSourceFile, sourceFile);
}

function sortTypeMembers(node: ts.InterfaceDeclaration | ts.TypeAliasDeclaration, sourceFile: ts.SourceFile) {
  const members = ts.isInterfaceDeclaration(node) ? node.members : ts.isTypeLiteralNode(node.type) ? node.type.members : [];

  const sortedMembersArray = members.slice().sort((a, b) => {
    if (ts.isPropertySignature(a) && ts.isPropertySignature(b)) {
      const aName = a.name.getText(sourceFile);
      const bName = b.name.getText(sourceFile);
      return aName.localeCompare(bName);
    }
    return 0;
  });
  // @ts-ignore
  return ts.factory.createNodeArray(sortedMembersArray, members.hasTrailingComma);
}

function updateTypeNode(node: ts.InterfaceDeclaration | ts.TypeAliasDeclaration, sortedMembers: ts.NodeArray<ts.TypeElement>) {
  if (ts.isInterfaceDeclaration(node)) {
    return ts.factory.updateInterfaceDeclaration(
      node,
      node.decorators,
      node.modifiers,
      node.name,
      node.typeParameters,
      node.heritageClauses,
      sortedMembers
    );
  } else if (ts.isTypeAliasDeclaration(node)) {
    if (ts.isTypeLiteralNode(node.type)) {
      const updatedType = ts.factory.updateTypeLiteralNode(node.type, sortedMembers);
      return ts.factory.updateTypeAliasDeclaration(
        node,
        node.decorators,
        node.modifiers,
        node.name,
        node.typeParameters,
        updatedType
      );
    }
  }

  return node;
}
