@echo off
setlocal enabledelayedexpansion

:: List of dependencies from package.json
set "PACKAGE_JSON_DEPS="
for /f "delims=" %%i in ('jq -r ".dependencies, .devDependencies | keys_unsorted[]" package.json') do (
    set "PACKAGE_JSON_DEPS=!PACKAGE_JSON_DEPS! %%i"
)

:: List of installed dependencies
set "INSTALLED_DEPS="
for /f "tokens=3 delims=\" %%i in ('npm list --parseable --depth=0 ^| findstr /v "node_modules"') do (
    set "dep=%%i"
    if "!dep!" neq "vscode-diff-merge" (
        set "INSTALLED_DEPS=!INSTALLED_DEPS! !dep!"
    )
)

:: Uninstall extraneous dependencies
for %%i in (%INSTALLED_DEPS%) do (
    set "IS_EXTRANEOUS=true"
    for %%j in (%PACKAGE_JSON_DEPS%) do (
        if "%%i"=="%%j" set "IS_EXTRANEOUS=false"
    )
    if "!IS_EXTRANEOUS!"=="true" (
        npm uninstall %%i
    )
)
