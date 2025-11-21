Submission README

What this package contains
- Full project source code for UH-IAS (contracts, backend, frontend, scripts, datasets, docs).
- A generated synthetic dataset: `datasets/synthetic_health_blockchain_dataset.csv` (5000 records).
- Documentation in `docs/` including a project report and dataset description.

Files excluded from the submission ZIP
- `.git/` directory (VCS metadata)
- `node_modules/` (dependency installs)
- Any local secrets such as `.env` files (please review before submission)

How to push this repository to GitHub (recommended - run these on your machine)
1. Ensure you have Git installed and you are signed in to GitHub (or have a PAT configured).
2. From the project root (`C:\Users\yoges\healthcare`) run these commands:

```powershell
# initialize and commit (only if not already initialized locally)
git init
git checkout -b main
git add -A
git commit -m "Submission: initial project commit"

# add your remote (replace remote url if different)
git remote add origin https://github.com/yocase11/healthcare.git

# push using HTTPS (you will be prompted for credentials / PAT)
git push -u origin main
```

If you prefer SSH, use:
```powershell
git remote add origin git@github.com:yocase11/healthcare.git
git push -u origin main
```

If Git prompts for credentials: use your GitHub username and a Personal Access Token (PAT) as the password (recommended). Do not share the PAT.

If you want me to push directly from this environment, I can only do so if you run the final push command locally with your credentials or provide a secure method of authentication (not recommended here). Therefore the safest approach is to run the push locally.

If you prefer, I created `submission_package.zip` in the project root which you can upload to a submission portal instead of pushing to GitHub.

Contact me if you'd like me to also prepare a short video or README summary for faculty evaluation.