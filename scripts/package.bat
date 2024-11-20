@echo off
setlocal

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

endlocal
