import { readFileSync } from 'fs';
import { getRootPath } from './path';
import { execSync } from 'child_process';
import * as istextorbinary from 'istextorbinary';
import { utf8Stream, fileNotSupported, cwdCommandOptions } from './constants';
import { log } from './logger';
import { isGit, isSvn } from './vc';
import { patchToCodes } from './patch';

export function getExplorerSides(leftPath: string, rightPath: string) {
  const leftContent = getContentOrFallback(leftPath) || fileNotSupported;
  const rightContent = getContentOrFallback(rightPath) || fileNotSupported;

  return { leftContent, rightContent };
}

export function getGitSides(path: string) {
  const rootPath = getRootPath();
  let leftContent = '';
  let rightContent;
  try {
    let patch: string;

    if (isGit()) {
      const cmdIsStaged = 'git diff --cached --name-only';
      log(cmdIsStaged);
      const isStagedOutput = execSync(cmdIsStaged, cwdCommandOptions).toString();
      log(`isStagedOutput: ${isStagedOutput}`);
      const isStaged = isStagedOutput.split(/\n/g).includes(path);

      const cmdGitDiff = `git diff -U100000 ${isStaged ? '--cached' : ''} -- ${path}`;
      log(cmdGitDiff);
      patch = execSync(cmdGitDiff, cwdCommandOptions).toString();
    } else if (isSvn()) {
      const cmdSvnDiff = `svn diff --internal-diff -x "-U100000" ${path}`;
      log(cmdSvnDiff);
      patch = execSync(cmdSvnDiff, cwdCommandOptions).toString();
    } else {
      throw new Error(
        `folder is not .git nor .svn. I don't how to hadnle it. Pease file an issue`
      );
    }

    if (patch) {
      ({ leftContent, rightContent } = patchToCodes(patch));
    } else {
      // no diff
      rightContent = getContentOrFallback(`${rootPath}/${path}`);
    }
  } catch (error) {
    log(String(error));
    rightContent = getContentOrFallback(`${rootPath}/${path}`);
  }

  return { leftContent, rightContent };
}

export function getContentOrFallback(path: string) {
  const content = readFileSync(path, 'utf8');
  const isText = istextorbinary.isText(undefined, Buffer.from(content));
  if (!isText) {
    return '';
  }
  return content;
}
