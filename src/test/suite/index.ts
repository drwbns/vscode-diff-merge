import * as path from 'path';
import Mocha from 'mocha';
import { promisify } from 'util';
import glob from 'glob';

const globPromise = promisify(glob.glob);

export async function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
  });
  mocha.options.color = true;

  const testsRoot = path.resolve(__dirname, '..');

  try {
    // Get the list of test files using glob with promises
    const files: string[] = await globPromise('**/**.test.js', { cwd: testsRoot, nodir: true }) as string[];

    // Add files to the test suite
    files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

    // Run the mocha test
    const failures = await new Promise<number>((resolve, reject) => {
      mocha.run(resolve).on('error', reject);
    });

    if (failures > 0) {
      throw new Error(`${failures} tests failed.`);
    }
  } catch (err) {
    throw err;
  }
}
