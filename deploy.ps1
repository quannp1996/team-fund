# Build the project
npm run build

# Navigate to dist folder
cd dist

# Initialize git and push to gh-pages branch
git init
git add -A
git commit -m "deploy"
git push -f https://github.com/quannp1996/team-fund.git master:gh-pages

cd ..
