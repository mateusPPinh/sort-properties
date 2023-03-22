import * as ts from 'typescript';

export function sortInterfacesAndPropsAlphabetically(sourceCode: string, fileName: string): string {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceCode,
    ts.ScriptTarget.ESNext,
    true
  );
  const printer = ts.createPrinter({
    newLine:
      sourceFile.getLineEndOfPosition(sourceFile.getEnd()) === ts.NewLineKind.CarriageReturnLineFeed
        ? ts.NewLineKind.CarriageReturnLineFeed
        : ts.NewLineKind.LineFeed,
  });

  const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    const visit: ts.Visitor = (node) => {
      // Verifique se o nó atual é um arquivo de origem e se é um arquivo TypeScript ou TypeScript React
      if (ts.isSourceFile(node)) {
        if (!node.fileName.endsWith('.ts') && !node.fileName.endsWith('.tsx')) {
          return node;
        }
      }

      // Se o nó atual for uma função ou método, não visite os filhos
      if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
        return node;
      }

      // Verifique se o nó atual é um TypeAliasDeclaration ou InterfaceDeclaration
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

  return customJsxPrinter(printer, transformedSourceFile, sourceFile);
}

function customJsxPrinter(printer: ts.Printer, node: ts.Node, sourceFile: ts.SourceFile): string {
  if (ts.isJsxElement(node)) {
    const opening = printer.printNode(ts.EmitHint.Unspecified, node.openingElement, sourceFile);
    const closing = printer.printNode(ts.EmitHint.Unspecified, node.closingElement, sourceFile);
    const children = node.children.map((child) => printer.printNode(ts.EmitHint.Unspecified, child, sourceFile)).join('');
    return opening + children + closing;
  } else if (ts.isInterfaceDeclaration(node) && node.members.length === 0) {
    const interfaceKeyword = printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
    return `${interfaceKeyword} {}`;
  }
  return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
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

function updateTypeNode(node: ts.InterfaceDeclaration | ts.TypeAliasDeclaration, sortedMembers:
 ts.NodeArray<ts.TypeElement>) {
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
