import { init } from './commands';
import { ExtensionContext } from 'vscode';
import { log } from './logger';
import versionInfo from '../version.json';

export function activate(context: ExtensionContext) {
  init(context);
  log(`Diff Merge extension loaded (version ${versionInfo.version})`);
  log(process.env);
}
