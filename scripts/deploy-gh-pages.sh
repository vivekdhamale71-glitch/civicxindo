#!/usr/bin/env bash
# Builds for GitHub Pages (served under /<repo>/) and publishes dist/ to the gh-pages branch.
set -euo pipefail
REPO_URL=$(git remote get-url origin)
REPO_NAME=$(basename -s .git "$REPO_URL")
export BASE_PATH="/${REPO_NAME}/"
npm run build
touch dist/.nojekyll
cd dist
git init -q -b gh-pages
git add -A
git -c commit.gpgsign=false commit -q -m "Deploy $(date -u +%Y-%m-%dT%H:%M:%SZ)"
git push -q -f "$REPO_URL" gh-pages
rm -rf .git
echo "Published to gh-pages for ${BASE_PATH}"
