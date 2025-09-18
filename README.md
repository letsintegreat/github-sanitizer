# GitHub Bot Comment Hider

A lightweight Chrome extension that hides bot comments in GitHub pull request conversations, making it easier to focus on human review comments.

## Features

- 🤖 **Automatically detects and hides bot comments** from popular services like:
  - Dependabot, Renovate, GitHub Actions
  - CodeCov, SonarCloud, Vercel, Netlify
  - CircleCI, Travis CI, Jenkins
  - And many more automated services
- 🔄 **Toggle visibility** with a single click
- 📊 **Shows count** of hidden bot comments
- 🎨 **GitHub-native styling** that matches the site's design
- 🌙 **Dark theme support**
- ⚡ **Real-time detection** of new comments as they appear
- 💾 **Remembers your preferences** across sessions
- 🛡️ **Smart filtering** - Never hides the PR description, even if edited by bots
- 📍 **Persistent toggle** - Button stays visible and accessible at all times

## Installation

### Method 1: Load as Unpacked Extension (Recommended for Development)

1. **Download the extension files**:

   - Clone or download this repository
   - Or download the files individually:
     - `manifest.json`
     - `content.js`
     - `styles.css`
     - `popup.html`
     - `popup.js`

2. **Icons are included**: The extension comes with all required icon files in the `icons/` directory.

3. **Open Chrome Extensions page**:

   - Go to `chrome://extensions/`
   - Or click the three dots menu → More tools → Extensions

4. **Enable Developer mode**:

   - Toggle the "Developer mode" switch in the top right corner

5. **Load the extension**:

   - Click "Load unpacked"
   - Select the folder containing the extension files
   - The extension should now appear in your extensions list

6. **Pin the extension** (optional):
   - Click the puzzle piece icon in the Chrome toolbar
   - Click the pin icon next to "GitHub Bot Comment Hider"

### Method 2: Create a .crx Package

1. **Follow steps 1-5 from Method 1**
2. **Pack the extension**:

   - In the Extensions page, click "Pack extension"
   - Select the extension folder
   - Click "Pack Extension"
   - This creates a `.crx` file and a `.pem` key file

3. **Install the packed extension**:
   - Drag and drop the `.crx` file onto the Extensions page
   - Click "Add extension" when prompted

## Usage

1. **Navigate to a GitHub pull request**:

   - Go to any GitHub repository
   - Open a pull request (URL should contain `/pull/`)

2. **The extension automatically activates**:

   - Bot comments are hidden by default
   - A toggle button appears in the conversation header
   - The button shows the count of hidden comments

3. **Toggle bot comment visibility**:

   - Click the "Show/Hide Bot Comments" button
   - Or use the extension popup (click the extension icon)

4. **Extension popup features**:
   - View current status (enabled/disabled)
   - See statistics (hidden vs total comments)
   - Quick actions: refresh page, show all, hide all
   - Toggle the extension on/off

## How It Works

The extension identifies bot comments using multiple detection methods in priority order:

### 1. GitHub's Official Bot Labels (Most Reliable)

- Detects the official `<span class="Label Label--secondary">bot</span>` element
- Also recognizes "app" and "service" labels
- This is the most accurate method as it uses GitHub's own classification

### 2. GitHub App URLs

- Identifies accounts with `/apps/` in their profile URL
- These are official GitHub Apps and integrations

### 3. Username Patterns (Fallback)

- Accounts ending with `[bot]` or `bot`
- Common bot services: `dependabot`, `renovate`, `github-actions`, etc.
- CI/CD services: `circleci`, `travis`, `jenkins`, etc.
- Security tools: `snyk`, `gitguardian`, `deepsource`, etc.

### 4. Content Analysis

- Comments containing "automatically generated"
- Comments with "automated comment" or similar phrases
- GitHub Action indicators and badges

### 5. Visual Indicators

- Service-specific avatars and indicators
- GitHub Action workflow indicators

## File Structure

```
github-bot-hider/
├── manifest.json          # Extension configuration
├── content.js            # Main functionality (bot detection & hiding)
├── styles.css            # Styling for toggle button and hidden states
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── icons/                # Extension icons (optional)
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## Customization

### Adding More Bot Patterns

Edit `content.js` and add patterns to the `botIndicators` array:

```javascript
this.botIndicators = [
  // Add your custom patterns here
  /your-custom-bot$/i,
  /another-pattern/i,
  // ... existing patterns
];
```

### Styling Modifications

Edit `styles.css` to customize:

- Toggle button appearance
- Hidden comment animations
- Dark theme colors
- Responsive behavior

### Popup Customization

Modify `popup.html` and `popup.js` to:

- Add new features
- Change the interface layout
- Add more statistics or controls

## Troubleshooting

### Extension Not Working

1. **Check if you're on a GitHub PR page**: The extension only works on URLs containing `github.com` and `/pull/`
2. **Refresh the page**: Sometimes a page refresh helps activate the extension
3. **Check extension permissions**: Ensure the extension has access to `github.com`

### Bot Comments Still Visible

1. **Check if extension is enabled**: Click the extension icon to see status
2. **Unknown bot patterns**: Some bots might not be detected - you can add custom patterns
3. **Page loaded before extension**: Try refreshing the page

### PR Description Hidden

**This should never happen!** The extension is designed to never hide the first comment (PR description), even if it was edited by bots. If this occurs:

1. **Refresh the page** - This usually resolves the issue
2. **Check browser console** for any JavaScript errors
3. **Report the issue** with the specific PR URL

### Toggle Button Not Appearing

1. **GitHub layout changes**: GitHub occasionally updates their layout
2. **Conflicting extensions**: Other GitHub extensions might interfere
3. **Console errors**: Check browser console (F12) for JavaScript errors

## Development

### Testing Changes

1. Make your changes to the files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Refresh any GitHub PR pages to see changes

### Debugging

- Open browser console (F12) on GitHub PR pages
- Check for error messages or logs
- Use `chrome://extensions/` to see extension errors

## Privacy & Permissions

This extension:

- ✅ Only runs on GitHub.com
- ✅ Does not collect or transmit any data
- ✅ Stores preferences locally in your browser
- ✅ Does not access private repositories beyond what you can already see
- ✅ Open source - you can review all code

Required permissions:

- `activeTab`: To access the current GitHub page
- `storage`: To remember your preferences
- `https://github.com/*`: To run on GitHub pages

## Contributing

Feel free to:

- Report issues or bugs
- Suggest new bot patterns to detect
- Improve the UI/UX
- Add new features
- Submit pull requests

## License

This project is open source. Feel free to use, modify, and distribute as needed.

---

**Made for developers who want cleaner GitHub PR reviews! 🚀**
