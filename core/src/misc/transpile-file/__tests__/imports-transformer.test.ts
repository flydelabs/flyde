import * as ts from 'typescript';
import { importsTransformer } from '../imports-transformer';
import * as fs from 'fs';
import * as path from 'path';

// Helper to transpile a snippet with the imports transformer.
function transpile(source: string, fileName: string): string {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS
  );

  const result = ts.transform(sourceFile, [importsTransformer]);
  const printer = ts.createPrinter();
  const transformed = printer.printFile(result.transformed[0] as ts.SourceFile);
  result.dispose();
  return transformed;
}

describe('importsTransformer', () => {
  const tmpDir = path.join(__dirname, 'tmp');
  const originalFile = path.join(tmpDir, 'original.ts');
  const movedFile = path.join(tmpDir, 'sub', 'moved.ts');

  beforeAll(() => {
    fs.mkdirSync(path.dirname(movedFile), { recursive: true });
    fs.writeFileSync(originalFile, '');
    fs.writeFileSync(movedFile, '');
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('rewrites relative imports when the target file is moved', () => {
    const source = `import { foo } from "./moved";\nexport const bar = foo;`;
    // Simulate that the source file lives next to the original location,
    // but the imported file has been moved to ./sub/moved.ts.
    const transformed = transpile(source, originalFile);

    // The transformer should adjust the import to point to the new location.
    expect(transformed).toContain(`import { foo } from "./sub/moved"`);
  });

  it('leaves non‑relative imports untouched', () => {
    const source = `import * as React from "react";`;
    const transformed = transpile(source, originalFile);
    expect(transformed).toContain(`import * as React from "react"`);
  });
});
