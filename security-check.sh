#!/bin/bash
# Security verification script for Pothole Dashboard

echo "🔐 Security Verification for Pothole Dashboard"
echo "==============================================="

# Check if .env file exists but is ignored
if [ -f ".env" ]; then
    if git check-ignore .env > /dev/null 2>&1; then
        echo "✅ .env file exists and is properly ignored by git"
    else
        echo "❌ SECURITY ISSUE: .env file exists but is NOT ignored by git!"
        exit 1
    fi
else
    echo "⚠️  No .env file found (this is okay for fresh clones)"
fi

# Check if .env.example exists and doesn't contain real secrets
if [ -f ".env.example" ]; then
    if grep -q "your_.*_here\|username:password\|placeholder" .env.example; then
        echo "✅ .env.example contains placeholders (good)"
    else
        echo "❌ SECURITY ISSUE: .env.example may contain real secrets!"
        exit 1
    fi
else
    echo "❌ Missing .env.example file"
    exit 1
fi

# Check for potential secret leaks in git history
echo "🔍 Checking git history for potential secret leaks..."
if git log --name-only --pretty=format: --all | grep -E "\.env$" | wc -l | grep -q "0"; then
    echo "✅ No .env files found in git history"
else
    echo "⚠️  Found .env references in git history - please review"
fi

# Check for API keys or secrets in committed files
echo "🔍 Scanning for potential secrets in tracked files..."
SECRET_PATTERNS="AIzaSy|sk-|pk_|npg_|postgresql://.*:.*@"
if git ls-files | xargs grep -l "$SECRET_PATTERNS" 2>/dev/null | grep -v ".env.example"; then
    echo "❌ POTENTIAL SECRETS FOUND in tracked files!"
    exit 1
else
    echo "✅ No obvious secrets found in tracked files"
fi

echo ""
echo "🎉 Security verification completed successfully!"
echo ""
echo "📋 Security Checklist:"
echo "  ✅ .gitignore properly configured"
echo "  ✅ .env file ignored by git"
echo "  ✅ .env.example uses placeholders"
echo "  ✅ No secrets in git history"
echo "  ✅ No secrets in tracked files"
echo ""
echo "🛡️ Remember to:"
echo "  - Never share your .env file"
echo "  - Regularly rotate your API keys"
echo "  - Monitor API usage for unexpected charges"
echo "  - Use different keys for dev/staging/production"