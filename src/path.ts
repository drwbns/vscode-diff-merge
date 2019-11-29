import { workspace } from 'vscode';
import { relative } from 'path';

export function getRootPath(): string {
  return workspace.workspaceFolders ? workspace.workspaceFolders[0].uri.fsPath : '';
}

export function getFilePath(path: string): string {
  if (workspace.workspaceFolders && path.includes(workspace.workspaceFolders[0].uri.fsPath)) {
    return relative(workspace.workspaceFolders[0].uri.fsPath, path);
  }
  return path;
}