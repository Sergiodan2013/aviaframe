# Contributing

Branching:
- Create feature branches from main (e.g. feature/short-description).

Pull requests:
- Open PRs for all changes. Include description and testing steps.
- Ensure linting and tests pass locally before opening a PR.

Development:
- npm ci
- npm run lint
- npm test
- npm run build

Creating the repository (example)
```bash
# Create GitHub repo (run locally)
gh repo create Sergiodan2013/aviaframe --private --description "Aviaframe monorepo" --confirm

# Initialize git locally, add files, push
git init
git branch -M main
git add .
git commit -m "chore: initial scaffold"
git remote add origin git@github.com:Sergiodan2013/aviaframe.git
git push -u origin main
```