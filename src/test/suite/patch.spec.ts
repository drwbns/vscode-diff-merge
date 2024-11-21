import { patchToCodes } from '../../patch';

test('patchToCodes', () => {
  test('should correctly parse a simple diff', () => {
    const diff = `@@ -1,4 +1,4 @@
-Hello World
+Hi World
`;

    const result = patchToCodes(diff);

    expect(result.leftContent).toBe(`Hello World`);
    expect(result.rightContent).toBe(`Hi World`);
  });

  test('should correctly parse a more complex diff', () => {
    const diff = `@@ -1,5 +1,6 @@
-Hello
-World
+Hi
+There
+World
`;

    const result = patchToCodes(diff);

    expect(result.leftContent).toBe(`Hello\nWorld`);
    expect(result.rightContent).toBe(`Hi\nThere\nWorld`);
  });
});
