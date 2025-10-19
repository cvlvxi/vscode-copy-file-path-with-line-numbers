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
  let justCodeBlock= function () {
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
    let lineNumbers = [];

    let pathRes = "";
    let selectionText = "";

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

    let language = "";
    if (editor.document.languageId) {
      language = editor.document.languageId;
      if (language === "typescriptreact") {
        language = "typescript";
      }
    }
    pathRes = "\n";
    pathRes += "```" + language + "\n";
    pathRes += `${selectionText}\n`
    pathRes += "```\n"
    return pathRes;
  };

  let copyPathLines = function (
    withLineNumber = false,
    withSelection = false,
    withPath = false,
    noCodeBlock = false,
    addHeader = false,
    justCodeBlock = false
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
        pathRes = `## ${path}`;
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

  let cmdJustCodeBlock= vscode.commands.registerCommand(
    "copy-relative-path-and-line-numbers.justCodeBlock",
    () => {
      let message = justCodeBlock()
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
        let workspaceName = workspaceFolder ? workspaceFolder.name.replace(/\s*\(.*?\)\s*/g, '') : '';
        const relativePath = vscode.workspace.asRelativePath(fullPath, false);

        // Trim relativePath to max 4 subdirectories
        const relParts = relativePath.split('/');
        const trimmedRelParts = relParts.slice(0, 4).concat(relParts.slice(4));
        const trimmedRelPath = trimmedRelParts.join('/') + ".snip.md";

        // Pick base folder (default to last used or workspace root)
        let lastDir = context.globalState.get('copyRelativePathAndLineNumbers.lastSnippetDir', '');
        let folderUri = lastDir ? vscode.Uri.file(lastDir) : workspaceFolder.uri;
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

        // Save file as lastDir/workspaceName/path/to/file.md
        const saveUri = vscode.Uri.joinPath(baseFolderUri, workspaceName, trimmedRelPath);

        // Save last used directory
        context.globalState.update('copyRelativePathAndLineNumbers.lastSnippetDir', baseFolderUri.fsPath);

        let fileContent = `${message}\n\n`;

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
    cmdCopyAndSaveSnippet,
    cmdJustCodeBlock
  );
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
