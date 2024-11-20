import { window } from 'vscode';

const logger = window.createOutputChannel('Diff Merge');

export function log(data: unknown) {
  if (typeof data === 'string') {
    logger.appendLine(data);
  } else if (typeof data === 'object' && data !== null) {
    logger.appendLine(JSON.stringify(data, null, 2));
  } else {
    logger.appendLine(String(data));
  }
  console.log(data);
}
