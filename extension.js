// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const clipboardy = require('clipboardy');


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    let copyPathLines = function(withLineNumber=false, withSelection=false){
        (vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', vscode.Uri.file(vscode.window.activeTextEditor.document.fileName)))
            .then((symbols) => {

        })

        let alertMessage = "File path not found!";
        if(!vscode.workspace.rootPath) {
            vscode.window.showWarningMessage(alertMessage);
            return false;
        }

        let editor = vscode.window.activeTextEditor
        if (!editor) {
            vscode.window.showWarningMessage(alertMessage);
            return false;
        }

        let doc = editor.document;
        if(doc.isUntitled) {
            vscode.window.showWarningMessage(alertMessage);
            return false;
        }

        let path = vscode.workspace.asRelativePath(doc.fileName);
        let lineNumbers = [];

        let pathRes = ""
        let selectionText = ""

        if (withLineNumber) {
            editor.selections.forEach(selection => {

                if (selection.isSingleLine) {

                    lineNumbers.push(selection.active.line + 1)

                } else {

                    lineNumbers.push((selection.start.line + 1) + ':' + (selection.end.line + 1))

                }
                selectionText = editor.document.getText(selection)

            })

            pathRes = "* [x] " + path + ':' + lineNumbers.join(',');
        } else {
            pathRes = path;
        }
        if (withSelection) {
            let language = ""
            if (editor.document.languageId) {
                language = editor.document.languageId
            }
            pathRes += "\n\n```"+language+`\n${selectionText}\n` + "```"
        }
        return pathRes
    }

    let toast = function (message) {
        vscode.window.setStatusBarMessage('`' + message + '` is copied to clipboard', 3000)
    }

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "copy-relative-path-and-line-numbers" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let cmdBoth = vscode.commands.registerCommand('copy-relative-path-and-line-numbers.both', () => {
        let message = copyPathLines(true);
        if (message !== false) {
            clipboardy.write(message).then(() => {
                toast(message);
            })
        }
    });
    let cmdSelectionText = vscode.commands.registerCommand('copy-relative-path-and-line-numbers.withText', () => {
        let message = copyPathLines(true, true);
        if (message !== false) {
            clipboardy.write(message).then(() => {
                toast(message);
            })
        }
    });

    let cmdPathOnly = vscode.commands.registerCommand('copy-relative-path-and-line-numbers.path-only', () => {
        let message = copyPathLines();
        if (message !== false) {
            clipboardy.write(message).then(() => {
                toast(message);
            })
        }
    });

    context.subscriptions.push(cmdBoth, cmdPathOnly, cmdSelectionText);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
