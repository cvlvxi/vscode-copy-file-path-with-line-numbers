yarn;
yarn postinstall;
vsce package;
code --install-extension copy-relative-path*.vsix --force;
