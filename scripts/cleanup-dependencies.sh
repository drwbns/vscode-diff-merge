#!/bin/bash

# List of dependencies from package.json
PACKAGE_JSON_DEPS=$(jq -r '.dependencies, .devDependencies | keys_unsorted[]' package.json)

# List of installed dependencies
INSTALLED_DEPS=$(npm list --parseable --depth=0 | grep -v 'node_modules' | awk -F/ '{print $NF}' | grep -v 'vscode-diff-merge')

# Uninstall extraneous dependencies
for DEP in $INSTALLED_DEPS; do
  if ! echo "$PACKAGE_JSON_DEPS" | grep -q "^$DEP$"; then
    npm uninstall $DEP
  fi
done
