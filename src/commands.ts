import { getFilePath } from './path';
import { showDiff, showNotSupported } from './webview';
import { getGitSides, getExplorerSides, getContentOrFallback } from './content';
import { getActiveDiffPanelWebview } from './webview/store';
import { commands, window, Uri, ExtensionContext, env, TextEditor } from 'vscode';
import { log } from './logger';
import { takeWhile, takeRightWhile } from 'lodash';
import { setDiffMergeFileSelected } from './context';
import * as vscode from 'vscode';
import { patchToCodes } from './patch';

export function init(context: ExtensionContext) {
	context.subscriptions.push(
		commands.registerCommand('diffMerge.scm.file', gitDiff),
		commands.registerCommand('diffMerge.blank', blank),
		commands.registerCommand('diffMerge.chooseFile', fileDiff),
		commands.registerCommand('diffMerge.nextDiff', nextDiff),
		commands.registerCommand('diffMerge.prevDiff', prevDiff),
		commands.registerCommand('diffMerge.compareSelected', fileDiff),
		commands.registerCommand('diffMerge.swap', swap),
		commands.registerCommand('diffMerge.selectToCompare', selectToCompare),
		commands.registerCommand(
			'diffMerge.compareWithSelected',
			compareWithSelected
		),
		commands.registerCommand(
			'diffMerge.compareFileWithClipboard',
			compareFileWithClipboard
		),
		commands.registerCommand('diffMerge.openWithDiffMerge', reopenCurrentWithDiffMerge),
		commands.registerCommand('diffMerge.applyAllChanges', applyAllChanges)
	);

	async function reopenCurrentWithDiffMerge() {
		const editor = window.activeTextEditor;
		if (!editor) return;
		const visibleEditors = window.visibleTextEditors;
		const editorIndex = visibleEditors.indexOf(editor);
		// This might not be always true. But it's the only way I can think of how to know whether it's a diff-editor.
		const isDiffEditor = (editor: TextEditor) => editor.viewColumn === undefined && ['git', 'file'].includes(editor.document.uri.scheme);
		// In case multiple diff-editors are open, we need to find the correct one.
		const diffEditors =
			takeRightWhile(visibleEditors.slice(undefined, editorIndex + 1), isDiffEditor)
				.concat(takeWhile(visibleEditors.slice(editorIndex + 1), isDiffEditor));
		const editorIndexInDiffEditors = diffEditors.indexOf(editor);
		// Get the editors content.
		const leftEditorIndex = Math.trunc(editorIndexInDiffEditors / 2) * 2;
		const [leftEditor, rightEditor] = diffEditors.slice(leftEditorIndex, leftEditorIndex + 2);
		if (leftEditor.document.uri.scheme === 'git') {
			return gitDiff({ resourceUri: leftEditor.document.uri });
		}
		else {
			const leftContent = leftEditor.document.getText();
			const leftPath = leftEditor.document.uri.fsPath;
			const rightContent = rightEditor.document.getText();
			const rightPath = rightEditor.document.uri.fsPath;
			return showDiff({ leftContent, rightContent, leftPath, rightPath, context });
		}
	}

	async function compareFileWithClipboard() {
		log('compareFileWithClipboard function called');
		const { document } = window.activeTextEditor || {};
		if (!document) {
			window.showInformationMessage(
				'This command has to be run only when a text based file is open'
			);
			log('This command has to be run only when a file is open');
			return;
		}
		const leftContent = await env.clipboard.readText();
		const rightContent = document.getText();
		const rightPath = document.uri.fsPath;
		log(`compareFileWithClipboard: leftContent=${leftContent}, rightContent=${rightContent}, rightPath=${rightPath}`);
		try {
			log('Calling showDiff from compareFileWithClipboard');
			showDiff({
				context,
				leftContent,
				leftPath: 'Clipboard',
				rightPath,
				rightContent,
			});
		} catch (error) {
			log(`Error in compareFileWithClipboard: ${error}`);
		}
	}

	function blank() {
		showDiff({ leftContent: '', rightContent: '', rightPath: '', context });
	}

	async function gitDiff(e: { resourceUri: Uri }) {
		try {
			const rightPath = getFilePath(e.resourceUri.fsPath);
			const { leftContent, rightContent } = await getGitSides(rightPath);
			if (rightContent || leftContent) {
				showDiff({ leftContent, rightContent, rightPath, context });
			} else {
				showNotSupported(context, rightPath, 'git');
			}
		} catch (error) {
			console.error(error);
		}
	}

	async function fileDiff(e: Uri, list?: Uri[]) {
		let leftPath, currentPath;
		if (list && list.length > 1) {
			[leftPath, currentPath] = list.map((p) => p.fsPath);
		} else {
			const file = await window.showOpenDialog({});
			if (file) {
				({ fsPath: leftPath } = file[0]);
				({ fsPath: currentPath } = e);
			}
		}

		if (leftPath && currentPath) {
			const rightPath = currentPath ? Uri.parse(currentPath).path : '';

			const { leftContent, rightContent } = await getExplorerSides(
				leftPath,
				rightPath
			);
			showDiff({ leftContent, rightContent, leftPath, rightPath, context });
		}
	}

	function nextDiff() {
		const webview = getActiveDiffPanelWebview();
		webview.api.sendNextDiff();
	}

	function prevDiff() {
		const webview = getActiveDiffPanelWebview();
		webview.api.sendPrevDiff();
	}

	function swap() {
		const webview = getActiveDiffPanelWebview();
		webview.swap();
	}

	let selectedFilePath: string;
	function selectToCompare(e: Uri) {
		try {
			selectedFilePath = tryToGetPath(e);
			log(`file selected: ${selectedFilePath || 'no file selected'}`);
			setDiffMergeFileSelected(true);
		} catch (error) {
			log(error as object);
		}
	}

	async function compareWithSelected(e: Uri) {
		try {
			const rightPath = tryToGetPath(e);
			if (!selectedFilePath) {
				log(
					`Somehow the user is able to "compare with selected without selecting a file first.\nSelected file path: ${selectedFilePath}`
				);
				const whatHappened = await window.showErrorMessage(
					'Have you selected a file to compare? ',
					'I did, let me open an issue',
					'I forgot'
				)
				if (
					(whatHappened) === 'I did, let me open an issue'
				) {
					env.openExternal(
						Uri.parse('https://github.com/moshfeu/vscode-diff-merge/issues/new')
					);
				}
				return;
			}
			const leftContent = await getContentOrFallback(selectedFilePath);
			const rightContent = await getContentOrFallback(rightPath);
			showDiff({
				context,
				leftContent,
				leftPath: selectedFilePath,
				rightPath,
				rightContent,
			});
			setDiffMergeFileSelected(false); // Reset the context after comparison
		} catch (error) {
			log(`There is a problem to compare with selected: ${error}`);
		}
	}

	function applyAllChanges() {
		const webview = getActiveDiffPanelWebview();
		webview.api.sendApplyAllChanges();
	}
}

function tryToGetPath(e: Uri) {
	if (e) {
		return e.fsPath;
	}
	if (window.activeTextEditor?.document.uri.fsPath) {
		return window.activeTextEditor.document.uri.fsPath;
	}
	window.showWarningMessage('No file selected');
	throw new Error('No file selected');
}

export function activate(context: vscode.ExtensionContext) {
		init(context);

		let disposable = vscode.commands.registerCommand('extension.diffMerge', () => {
				vscode.window.showInformationMessage('Diff Merge command executed!');
		});

		let checkDiffFromClipboardDisposable = vscode.commands.registerCommand('extension.checkDiffFromClipboard', async () => {
				try {
						const clipboardContent = await vscode.env.clipboard.readText();
						const diff = clipboardContent.trim();

						if (!diff) {
								vscode.window.showErrorMessage('No diff content found in clipboard.');
								return;
						}

						const result = patchToCodes(diff);

						const leftContent = result.leftContent;
						const rightContent = result.rightContent;

						const leftDocument = await vscode.workspace.openTextDocument({ content: leftContent, language: 'plaintext' });
						const rightDocument = await vscode.workspace.openTextDocument({ content: rightContent, language: 'plaintext' });

						vscode.window.showTextDocument(leftDocument, vscode.ViewColumn.One);
						vscode.window.showTextDocument(rightDocument, vscode.ViewColumn.Two);

						vscode.commands.executeCommand('vscode.diff', leftDocument.uri, rightDocument.uri, 'Diff from Clipboard');
				} catch (error) {
					const errorMessage = (error as Error).message;
					vscode.window.showErrorMessage(`Error processing diff: ${errorMessage}`);
				}
		});

		context.subscriptions.push(disposable);
		context.subscriptions.push(checkDiffFromClipboardDisposable);
	}

	export function deactivate() {}