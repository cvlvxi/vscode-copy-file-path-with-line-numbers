// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const clipboardy = require("clipboardy");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
  let copySimpleLine = function () {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      return false;
    }
    let doc = editor.document;
    if (doc.isUntitled) {
      return false;
    }
    let workspaceFolder = vscode.workspace.getWorkspaceFolder(doc.uri);
    let workspaceName = workspaceFolder ? workspaceFolder.name : '';
    let relativePath = vscode.workspace.asRelativePath(doc.fileName);
    let path = workspaceName ? `${workspaceName}/${relativePath}` : relativePath;
    let currentLine = editor.selection.active.line; // This is 0-indexed
    let currentLineNumber = currentLine + 1; // This is 1-indexed (human readable)
    let lineText = editor.document.lineAt(currentLine).text.trim();
    let copyString = `- ${path}:${currentLineNumber}:\`${lineText}\`\n`
    return copyString
  };

  let copyPathLines = function (
    withLineNumber = false,
    withSelection = false,
    withPath = false,
    noCodeBlock = false,
    addHeader = false
  ) {
    vscode.commands
      .executeCommand(
        "vscode.executeDocumentSymbolProvider",
        vscode.Uri.file(vscode.window.activeTextEditor.document.fileName)
      )
      .then((symbols) => { });

    let alertMessage = "File path not found!";
    if (!vscode.workspace.rootPath) {
      vscode.window.showWarningMessage(alertMessage);
      return false;
    }

    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage(alertMessage);
      return false;
    }

    let doc = editor.document;
    if (doc.isUntitled) {
      vscode.window.showWarningMessage(alertMessage);
      return false;
    }

    let workspaceFolder = vscode.workspace.getWorkspaceFolder(doc.uri);
    let workspaceName = workspaceFolder ? workspaceFolder.name : '';
    let relativePath = vscode.workspace.asRelativePath(doc.fileName);
    let path = workspaceName ? `${workspaceName}/${relativePath}` : relativePath;
    let lineNumbers = [];

    let pathRes = "";
    let selectionText = "";

    if (withLineNumber) {
      editor.selections.forEach((selection) => {
        if (selection.isSingleLine) {
          lineNumbers.push(selection.active.line + 1);
        } else {
          lineNumbers.push(
            selection.start.line + 1 + ":" + (selection.end.line + 1)
          );
        }
        selectionText = editor.document.getText(selection);
      });
    }
    if (withPath) {
      if (addHeader) {
        pathRes = `# ${path}`;
      } else {
        pathRes = path
      }
    }
    if (withLineNumber) {
      pathRes += ":" + lineNumbers.join(",");
    }

    if (withPath) {
      pathRes += "\n\n";
    }
    if (withSelection) {
      let language = "";
      if (editor.document.languageId) {
        language = editor.document.languageId;
        if (language === "typescriptreact") {
          language = "typescript";
        }
      }

      if (!noCodeBlock) {
        pathRes += "```" + language + "\n";
      }
      pathRes += `${selectionText}\n`

      if (!noCodeBlock) {
        pathRes += "```"
      }
    }
    return pathRes;
  };

  let toast = function (message) {
    vscode.window.setStatusBarMessage(
      "`" + message + "` is copied to clipboard",
      3000
    );
  };

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "copy-relative-path-and-line-numbers" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let cmdFileOnlyLineNumber = vscode.commands.registerCommand(
    "copy-relative-path-and-line-numbers.justFileLineNumber",
    () => {
      let message = copyPathLines(true, false, true);
      if (message !== false) {
        clipboardy.write(message).then(() => {
          // toast(message);
        });
      }
    }
  );
  let cmdBoth = vscode.commands.registerCommand(
    "copy-relative-path-and-line-numbers.both",
    () => {
      let message = copyPathLines(true);
      if (message !== false) {
        clipboardy.write(message).then(() => {
          // toast(message);
        });
      }
    }
  );
  let cmdSelectionText = vscode.commands.registerCommand(
    "copy-relative-path-and-line-numbers.withText",
    () => {
      let message = copyPathLines(true, true, true);
      if (message !== false) {
        clipboardy.write(message).then(() => {
          // toast(message);
          // vscode.window.showInformationMessage('Copied to clipboard (snippet+codeblock)');
        });
      }
    }
  );

  let cmdPathOnly = vscode.commands.registerCommand(
    "copy-relative-path-and-line-numbers.path-only",
    () => {
      let message = copyPathLines();
      if (message !== false) {
        clipboardy.write(message).then(() => {
          // toast(message);
          // vscode.window.showInformationMessage('Copied to clipboard (pathonly)');
        });
      }
    }
  );

  let cmdNoCodeBlock = vscode.commands.registerCommand(
    "copy-relative-path-and-line-numbers.snippet",
    () => {
      let message = copyPathLines(true, true, true, true);
      if (message !== false) {
        clipboardy.write(message).then(() => {
          // toast(message);
          // vscode.window.showInformationMessage('Copied to clipboard (nocodeblock)');
        });
      }
    }
  );

  let cmdSimpleCopyLine = vscode.commands.registerCommand(
    "copy-relative-path-and-line-numbers.simple-copy-line",
    () => {
      let message = copySimpleLine();
      if (message !== false) {
        clipboardy.write(message).then(() => {
          // toast(message);
          // vscode.window.showInformationMessage('Copied to clipboard (Simple Copy Line)');
        });
      }
    }
  );


  let cmdCopyAndSaveSnippet = vscode.commands.registerCommand(
    "copy-relative-path-and-line-numbers.copyAndSaveSnippet",
    async () => {
      let message = copyPathLines(true, true, true, false, true);
      if (message !== false) {
        let editor = vscode.window.activeTextEditor;
        let fullPath = editor.document.fileName;

        // Get workspace folder and relative path
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
        if (!workspaceFolder) {
          vscode.window.showErrorMessage("Workspace folder not found.");
          return;
        }
        const workspaceName = workspaceFolder.name;
        const relativePath = vscode.workspace.asRelativePath(fullPath, false);

        // Get config directory
        const configDir = vscode.workspace.getConfiguration().get('copyRelativePathAndLineNumbers.snippetSaveDirectory') || '';
        let defaultFileName = `${workspaceName}/${relativePath.replace(/\.[^/.]+$/, ".md")}`;
        if (configDir) {
          defaultFileName = `${configDir}/${relativePath.replace(/\.[^/.]+$/, ".md")}`;
        }

        // Prompt user for filename (default to defaultFileName)
        const userFileName = await vscode.window.showInputBox({
          prompt: 'Enter filename for the snippet',
          placeHolder: defaultFileName,
          value: defaultFileName
        });

        if (userFileName === undefined) {
          return;
        }

        // Ensure .md extension
        let fileName = userFileName.trim();
        if (!fileName.endsWith('.md')) {
          fileName += '.md';
        }

        // Check for subdirectory in filename
        const hasSubdir = fileName.includes('/') || fileName.includes('\\');
        let saveUri;

        if (hasSubdir) {
          const subDir = fileName.substring(0, fileName.lastIndexOf('/'));
          const confirm = await vscode.window.showQuickPick(
            ['Yes', 'No'],
            { placeHolder: `Create subdirectory "${subDir}"?` }
          );
          if (confirm !== 'Yes') {
            return;
          }

          // Pick base folder (default to last used or workspace root)
          let lastDir = context.globalState.get('copyRelativePathAndLineNumbers.lastSnippetDir', '');
          let folderUri;
          if (lastDir) {
            folderUri = vscode.Uri.file(lastDir);
          } else {
            folderUri = workspaceFolder.uri;
          }
          const pickedFolder = await vscode.window.showOpenDialog({
            defaultUri: folderUri,
            canSelectFolders: true,
            canSelectFiles: false,
            openLabel: 'Select base folder for snippet'
          });
          if (!pickedFolder || pickedFolder.length === 0) {
            return;
          }
          let baseFolderUri = pickedFolder[0];

          // If the selected folder matches the first part of the subDir, skip it
          const subDirParts = subDir.split('/');
          const selectedFolderName = baseFolderUri.fsPath.split('/').pop();
          let subDirToCreate = subDir;
          if (selectedFolderName === subDirParts[0]) {
            // Remove the first part
            subDirToCreate = subDirParts.slice(1).join('/');
          }

          let targetDirUri = baseFolderUri;
          if (subDirToCreate) {
            targetDirUri = vscode.Uri.joinPath(baseFolderUri, subDirToCreate);
            try {
              await vscode.workspace.fs.createDirectory(targetDirUri);
            } catch (e) {
              // Directory may already exist, ignore
            }
          }

          // Save file in the created directory
          saveUri = vscode.Uri.joinPath(targetDirUri, fileName.split('/').pop());
          // Save last used directory
          context.globalState.update('copyRelativePathAndLineNumbers.lastSnippetDir', targetDirUri.fsPath);
        } else {
          // No subdirectory, use last used or workspace root
          let lastDir = context.globalState.get('copyRelativePathAndLineNumbers.lastSnippetDir', '');
          let defaultUri;
          if (lastDir) {
            defaultUri = vscode.Uri.file(lastDir + '/' + fileName);
          } else {
            defaultUri = vscode.Uri.joinPath(workspaceFolder.uri, fileName);
          }
          saveUri = await vscode.window.showSaveDialog({
            defaultUri: defaultUri,
            saveLabel: 'Save Snippet'
          });
          if (!saveUri) {
            return;
          }
          // Save last used directory
          context.globalState.update('copyRelativePathAndLineNumbers.lastSnippetDir', saveUri.fsPath.replace(/\/[^\/]+$/, ''));
        }

        let fileContent = `---\n\n${message}\n---\n\n`;

        try {
          let existingContent = '';
          try {
            const existingFile = await vscode.workspace.fs.readFile(saveUri);
            existingContent = Buffer.from(existingFile).toString('utf8');
          } catch (error) {
            // File doesn't exist, that's fine
          }

          let finalContent;
          if (existingContent.length > 0) {
            finalContent = existingContent + '\n\n' + fileContent;
          } else {
            finalContent = fileContent;
          }

          await vscode.workspace.fs.writeFile(saveUri, Buffer.from(finalContent, 'utf8'));

          // Open the saved file in VS Code
          const document = await vscode.workspace.openTextDocument(saveUri);
          await vscode.window.showTextDocument(document);

          vscode.window.showInformationMessage(`Snippet saved to ${saveUri.fsPath}`);
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to save file: ${error.message}`);
        }
      }
    }
  );

  context.subscriptions.push(
    cmdFileOnlyLineNumber,
    cmdBoth,
    cmdPathOnly,
    cmdSelectionText,
    cmdNoCodeBlock,
    cmdSimpleCopyLine,
    cmdCopyAndSaveSnippet
  );
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
