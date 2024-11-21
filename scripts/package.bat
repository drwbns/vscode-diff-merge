@echo off
setlocal

echo Installing dependencies
npm install
if %errorlevel% neq 0 (
  exit /b 125
)

echo Compiling TypeScript files
tsc -p .
if %errorlevel% neq 0 (
  exit /b 125
)

echo Building Monaco editor
cd resources\monaco
echo yarn
yarn
if %errorlevel% neq 0 (
  exit /b 125
)

echo yarn test:unit
yarn test:unit
if %errorlevel% neq 0 (
  exit /b 125
)

echo yarn build
yarn build
if %errorlevel% neq 0 (
  exit /b 125
)

echo Packaging extension
cd ..
cd ..
vsce package
if %errorlevel% neq 0 (
  exit /b 125
)

endlocal
