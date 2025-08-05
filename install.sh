yarn;
yarn postinstall;
vsce package;
if [ -z "$1" ]; then
    code --install-extension copy-relative-path-and*.vsix --force;
else
    code-insiders --install-extension copy-relative-path-and*.vsix --force;
fi

