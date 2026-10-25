#!/bin/sh
# Builds the site and publishes dist/ to the gh-pages branch of origin.
set -eu
cd "$(dirname "$0")/.."
npm run build
git worktree prune
git branch -D gh-pages >/dev/null 2>&1 || true
WORK=$(mktemp -d)
trap 'git worktree remove --force "$WORK" >/dev/null 2>&1 || true' EXIT
git worktree add --detach "$WORK" >/dev/null
(
  cd "$WORK"
  git checkout -q --orphan gh-pages
  git rm -q -rf . >/dev/null
  cp -R "$OLDPWD/dist/." .
  touch .nojekyll
  git add -A
  git commit -q -m "Deploy $(date -u +%Y-%m-%dT%H:%MZ)"
  git push -q -f origin gh-pages
)
echo "Deployed to gh-pages"
