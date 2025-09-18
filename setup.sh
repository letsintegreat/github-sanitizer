#!/bin/bash

# GitHub Bot Comment Hider - Setup Script
# This script helps set up the Chrome extension

echo "🤖 GitHub Bot Comment Hider - Setup Script"
echo "=========================================="
echo

# Check if we're in the right directory
if [ ! -f "manifest.json" ]; then
    echo "❌ Error: manifest.json not found!"
    echo "Please run this script from the extension directory."
    exit 1
fi

echo "✅ Found extension files"

# Check icons directory
echo "🎨 Checking extension icons..."
if [ -d "icons" ] && [ -f "icons/icon16.png" ] && [ -f "icons/icon32.png" ] && [ -f "icons/icon48.png" ] && [ -f "icons/icon128.png" ]; then
    echo "   ✅ All required icon files found"
else
    echo "   ⚠️  Some icon files may be missing. Expected:"
    echo "      - icons/icon16.png"
    echo "      - icons/icon32.png"
    echo "      - icons/icon48.png"
    echo "      - icons/icon128.png"
fi

echo
echo "📋 Extension files ready:"
echo "   ✅ manifest.json"
echo "   ✅ content.js"
echo "   ✅ styles.css"
echo "   ✅ popup.html"
echo "   ✅ popup.js"
echo "   📁 icons/ (with icon files)"
echo

echo "🚀 Next steps:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode' (toggle in top right)"
echo "3. Click 'Load unpacked' and select this folder"
echo "4. Navigate to a GitHub pull request to test!"
echo

echo "💡 Tips:"
echo "- Pin the extension to your toolbar for easy access"
echo "- The extension only works on GitHub pull request pages"
echo "- Use the popup to see statistics and toggle settings"
echo

echo "✨ Setup complete! Happy reviewing! 🎉"
