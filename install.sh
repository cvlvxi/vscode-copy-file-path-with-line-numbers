yarn;
yarn postinstall;
vsce package;

if [ -z "$1" ]; then
    code --install-extension *.vsix --force;
elif [ "$1" = "insiders" ]; then
    code-insiders --install-extension *.vsix --force;
elif [ "$1" = "codium" ]; then
    codium --install-extension *.vsix --force;
else
  echo "Invalid args specified"
fi

