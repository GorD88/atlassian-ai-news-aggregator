#!/bin/bash

# Auto-commit script for AI News Aggregator
# Usage: ./scripts/auto-commit.sh "commit message"

COMMIT_MSG="$1"

if [ -z "$COMMIT_MSG" ]; then
    echo "Usage: ./scripts/auto-commit.sh 'commit message'"
    exit 1
fi

# Get the project root directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

# Check if there are changes
if [ -z "$(git status --porcelain)" ]; then
    echo "No changes to commit"
    exit 0
fi

# Add all changes
git add .

# Commit with message
git commit -m "$COMMIT_MSG"

echo "Committed: $COMMIT_MSG"

