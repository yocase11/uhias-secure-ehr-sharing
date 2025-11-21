<#
PowerShell helper: push_to_github.ps1
Run this locally from the project root to initialize (if needed) and push to a remote GitHub repo.
Usage: Open PowerShell in C:\Users\yoges\healthcare and run:
    .\scripts\push_to_github.ps1 -RemoteUrl https://github.com/yocase11/healthcare.git

This script will NOT accept or store credentials. Git will prompt for your username and PAT when pushing via HTTPS.
If you prefer SSH, provide an SSH remote URL (git@github.com:yocase11/healthcare.git) and ensure your SSH key is added to GitHub.
#>
param(
    [string]$RemoteUrl = "https://github.com/yocase11/healthcare.git",
    [string]$Branch = "main"
)

function Run-Git {
    param([string]$Args)
    Write-Output "git $Args"
    $rc = git $Args
    if ($LASTEXITCODE -ne 0) {
        throw "git $Args failed with exit code $LASTEXITCODE"
    }
    return $rc
}

Push-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Definition)
# move to repository root (assumes script sits in scripts/)
Set-Location -Path (Resolve-Path "..\")

# Initialize if needed
if (-not (Test-Path .git)) {
    Write-Output "No .git found — initializing repository and creating branch '$Branch'"
    git init
    git checkout -b $Branch
} else {
    Write-Output ".git exists — using existing repository"
}

# Commit any unstaged changes
$status = git status --porcelain
if ($status) {
    Write-Output "Staging and committing changes..."
    git add -A
    git commit -m "Submission: initial project commit"
} else {
    Write-Output "No changes to commit"
}

# Configure remote
$existing = git remote
if ($existing -match 'origin') {
    Write-Output "Resetting existing 'origin' to $RemoteUrl"
    git remote remove origin
}
git remote add origin $RemoteUrl

# Push — Git will prompt for credentials if needed
try {
    Write-Output "Pushing to $RemoteUrl on branch $Branch..."
    git push -u origin $Branch
    Write-Output "Push completed successfully."
} catch {
    Write-Error "Push failed: $_"
    Write-Output "If the remote has existing commits you need to pull/merge first, or use --force if you intend to overwrite."
}

Pop-Location
