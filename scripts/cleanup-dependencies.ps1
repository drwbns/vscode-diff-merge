# List of dependencies from package.json
$packageJson = Get-Content -Raw -Path package.json | ConvertFrom-Json
$dependencies = $packageJson.dependencies.PSObject.Properties.Name + $packageJson.devDependencies.PSObject.Properties.Name

# List of installed dependencies
$installedDependencies = npm list --parseable --depth=0 | Select-String -NotMatch "node_modules" | ForEach-Object { $_.ToString().Split('\')[-1] } | Where-Object { $_ -ne "vscode-diff-merge" }

# Uninstall extraneous dependencies
foreach ($dep in $installedDependencies) {
    if ($dependencies -notcontains $dep) {
        npm uninstall $dep
    }
}
