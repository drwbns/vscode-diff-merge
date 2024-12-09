import * as path from 'path';
import { runCLI } from '@jest/core';

export async function run(): Promise<void> {
    const config = {
        roots: [path.resolve(__dirname, '..')],
        testMatch: ['**/*.spec.ts'],
        transform: {
            '^.+\\.ts$': 'ts-jest',
        },
    };

    try {
        const { results } = await runCLI(
            { config: JSON.stringify(config) } as any,
            [process.cwd()]
        );

        if (results.numFailedTests > 0) {
            throw new Error(`${results.numFailedTests} tests failed.`);
        }
    } catch (err) {
        throw err;
    }
}
