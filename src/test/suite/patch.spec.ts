import { patchToCodes } from '../../patch';

describe('patchToCodes', () => {
  it('should correctly parse a simple diff', () => {
    const diff = `@@ -1,4 +1,4 @@
-Hello World
+Hi World
`;

    const result = patchToCodes(diff);

    expect(result.leftContent).toBe(`Hello World`);
    expect(result.rightContent).toBe(`Hi World`);
  });
});
