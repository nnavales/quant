#!/usr/bin/env bash
set -e

VERSION="${1#v}"  # Remove leading 'v' if present

if [ -z "$VERSION" ]; then
    echo "Usage: ./scripts/bump-version.sh <version>"
    echo "Examples:"
    echo "  ./scripts/bump-version.sh 0.2.0"
    echo "  ./scripts/bump-version.sh v0.2.0"
    exit 1
fi

echo "Bumping version to $VERSION..."

# Update package.json
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('app/package.json', 'utf8'));
pkg.version = '$VERSION';
fs.writeFileSync('app/package.json', JSON.stringify(pkg, null, 2) + '\\n');
"

# Update Cargo.toml
if command -v sed &> /dev/null; then
    sed -i "s/^version = \"[^\"]*\"/version = \"$VERSION\"/" app/src-tauri/Cargo.toml
else
    echo "Warning: sed not found, skipping Cargo.toml update"
fi

# Update tauri.conf.json
node -e "
const fs = require('fs');
const conf = JSON.parse(fs.readFileSync('app/src-tauri/tauri.conf.json', 'utf8'));
conf.version = '$VERSION';
fs.writeFileSync('app/src-tauri/tauri.conf.json', JSON.stringify(conf, null, 4) + '\\n');
"

echo "Version bumped to $VERSION in:"
echo "  - app/package.json"
echo "  - app/src-tauri/Cargo.toml"
echo "  - app/src-tauri/tauri.conf.json"
echo "  - app/src/components/UpdateChecker.tsx"
echo ""
echo "Next steps:"
echo "  git add ."
echo "  git commit -m 'chore: bump version to $VERSION'"
echo "  git tag v$VERSION"
echo "  git push origin master && git push origin v$VERSION"

# Update UpdateChecker.tsx
node -e "
const fs = require('fs');
const path = 'app/src/components/UpdateChecker.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/CURRENT_VERSION = \"[^\"]*\"/, 'CURRENT_VERSION = \"$VERSION\"');
fs.writeFileSync(path, content);
"
