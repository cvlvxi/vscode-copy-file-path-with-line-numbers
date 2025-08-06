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
    let path = vscode.workspace.asRelativePath(doc.fileName);
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
    noCodeBlock = false
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

    let path = vscode.workspace.asRelativePath(doc.fileName);
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
    if (withPath && withLineNumber) {
      // pathRes = path + ":" + lineNumbers.join(",");
      pathRes = ""
    }
    if (withSelection) {
      let language = "";
      if (editor.document.languageId) {
        language = editor.document.languageId;
        if (language === "typescriptreact") {
          language = "typescript";
        }
      }
      // Update: 2025-02-28 to use Named Code Blocks
      // pathRes += "\n\n"

      if (!noCodeBlock) {
        // pathRes += "```" + language + "\n"
        pathRes += "```" + language + ":" + path + "\n"
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
      let message = copyPathLines(true, true, true);
      if (message !== false) {
        // Get the current file's full path
        let editor = vscode.window.activeTextEditor;
        let fullPath = editor.document.fileName;

        // Create the header with full path and add it before the snippet
        let fileContent = `# Snippet\n\n## Source\n\n[${fullPath}]\n\n${message}`;

        // Get the last inputted filename from global state
        const lastFileName = context.globalState.get('lastSnippetFileName', 'snippet');

        // Prompt user for filename
        const userFileName = await vscode.window.showInputBox({
          prompt: 'Enter filename for the snippet',
          placeHolder: 'snippet.md',
          value: lastFileName
        });

        // If user cancelled the input, return early
        if (userFileName === undefined) {
          return;
        }

        // Add .md extension if not present
        let fileName = userFileName.trim();
        if (!fileName.endsWith('.md')) {
          fileName += '.md';
        }

        // Store the entered filename (without .md) for next time
        const fileNameWithoutExt = fileName.replace(/\.md$/, '');
        await context.globalState.update('lastSnippetFileName', fileNameWithoutExt);

        // Get the last saved folder from global state
        const lastSavedFolder = context.globalState.get('lastSavedFolder');

        // Determine the directory to check for existing files
        let directoryToCheck;
        if (lastSavedFolder) {
          directoryToCheck = lastSavedFolder;
        } else {
          directoryToCheck = process.cwd(); // Current working directory
        }

        // Function to check if file exists and generate unique name
        const generateUniqueFileName = async (baseName, directory) => {
          const nameWithoutExt = baseName.replace(/\.md$/, '');
          let counter = 1;
          let testFileName = baseName;
          
          while (true) {
            try {
              const testPath = vscode.Uri.joinPath(vscode.Uri.file(directory), testFileName);
              await vscode.workspace.fs.stat(testPath);
              // File exists, try next number
              const paddedCounter = counter.toString().padStart(2, '0');
              testFileName = `${paddedCounter}_${nameWithoutExt}.md`;
              counter++;
            } catch (error) {
              // File doesn't exist, we can use this name
              return testFileName;
            }
          }
        };

        // Get unique filename
        const uniqueFileName = await generateUniqueFileName(fileName, directoryToCheck);

        // Create default URI - use last saved folder if available, otherwise use current directory
        let defaultUri;
        if (lastSavedFolder) {
          defaultUri = vscode.Uri.joinPath(vscode.Uri.file(lastSavedFolder), uniqueFileName);
        } else {
          defaultUri = vscode.Uri.file(uniqueFileName);
        }

        // Open save dialog
        const saveUri = await vscode.window.showSaveDialog({
          defaultUri: defaultUri,
          filters: {
            'Markdown files': ['md'],
            'Text files': ['txt'],
            'All files': ['*']
          }
        });

        if (saveUri) {
          try {
            // Check if file exists and read existing content
            let existingContent = '';
            try {
              const existingFile = await vscode.workspace.fs.readFile(saveUri);
              existingContent = Buffer.from(existingFile).toString('utf8');
            } catch (error) {
              // File doesn't exist, that's fine - we'll create it
            }

            // If file exists, append with 2 newlines; otherwise use the full content
            let finalContent;
            if (existingContent.length > 0) {
              finalContent = existingContent + '\n\n' + fileContent;
            } else {
              finalContent = fileContent;
            }

            // Write the final content to the selected file
            await vscode.workspace.fs.writeFile(saveUri, Buffer.from(finalContent, 'utf8'));

            // Store the folder path for next time
            const folderPath = vscode.Uri.joinPath(saveUri, '..').fsPath;
            await context.globalState.update('lastSavedFolder', folderPath);

            // Open the saved file in VS Code
            const document = await vscode.workspace.openTextDocument(saveUri);
            await vscode.window.showTextDocument(document);

            vscode.window.showInformationMessage(`Snippet saved to ${saveUri.fsPath}`);
          } catch (error) {
            vscode.window.showErrorMessage(`Failed to save file: ${error.message}`);
          }
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
