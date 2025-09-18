// GitHub Bot Comment Hider - Content Script

class GitHubBotHider {
  constructor() {
    this.isEnabled = true;
    this.hiddenComments = new Set();
    this.observer = null;
    this.toggleButton = null;
    
    // Common bot indicators
    this.botIndicators = [
      // Bot account patterns
      /\[bot\]$/i,
      /bot$/i,
      /-bot$/i,
      /^dependabot/i,
      /^renovate/i,
      /^github-actions/i,
      /^codecov/i,
      /^sonarcloud/i,
      /^vercel/i,
      /^netlify/i,
      /^circleci/i,
      /^travis/i,
      /^jenkins/i,
      /^azure-pipelines/i,
      /^gitguardian/i,
      /^snyk/i,
      /^deepsource/i,
      /^codeclimate/i,
      /^lighthouse/i,
      /^bundlesize/i,
      /^size-limit/i,
      /^semantic-release/i,
      /^greenkeeper/i,
      /^pyup/i,
      /^safety/i,
      /^whitesource/i,
      /^mend/i,
      /^fossabot/i,
      /^allcontributors/i,
      /^stale/i,
      /^lock/i,
      /^mergify/i,
      /^bors/i,
      /^homu/i,
      /^bulldozer/i,
      /^danger/i,
      /^hound/i,
      /^pronto/i,
      /^rubocop/i,
      /^eslint/i,
      /^prettier/i,
      /^stylelint/i
    ];

    // Specific bot-like users (without "bot" label)
    this.botUsers = [
      'SD-111029'
    ];
    
    this.init();
  }

  async init() {
    // Load saved state
    const result = await chrome.storage.sync.get(['botHiderEnabled']);
    this.isEnabled = result.botHiderEnabled !== false; // Default to true
    
    this.createToggleButton();
    this.processExistingComments();
    this.observeNewComments();
  }

  createToggleButton() {
    // Create toggle button
    this.toggleButton = document.createElement('button');
    this.toggleButton.className = 'btn btn-sm bot-hider-toggle';
    this.toggleButton.innerHTML = `
      <svg class="octicon" width="16" height="16" viewBox="0 0 16 16">
        <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14.5c-3.58 0-6.5-2.92-6.5-6.5S4.42 1.5 8 1.5s6.5 2.92 6.5 6.5-2.92 6.5-6.5 6.5z"/>
        <path fill="currentColor" d="M6.5 5.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm1.5 3.5c0 1.38-1.12 2.5-2.5 2.5h-1c-1.38 0-2.5-1.12-2.5-2.5"/>
      </svg>
      ${this.isEnabled ? 'Show' : 'Hide'} Bot Comments
    `;
    this.toggleButton.title = this.isEnabled ? 'Show bot comments' : 'Hide bot comments';

    this.toggleButton.addEventListener('click', () => this.toggleBotComments());

    // Strategy 1: Try to place in PR header actions (outside of any comment)
    const prHeaderActions = document.querySelector('.gh-header-actions, .pr-toolbar .diffbar-item');
    if (prHeaderActions) {
      prHeaderActions.appendChild(this.toggleButton);
      return;
    }

    // Strategy 2: Try to place in discussion sidebar or similar safe area
    const discussionSidebar = document.querySelector('.discussion-sidebar-item, .discussion-sidebar');
    if (discussionSidebar) {
      const container = document.createElement('div');
      container.className = 'bot-hider-container discussion-sidebar-item';
      container.appendChild(this.toggleButton);
      discussionSidebar.insertBefore(container, discussionSidebar.firstChild);
      return;
    }

    // Strategy 3: Create a fixed position container at the top of the discussion
    const timeline = document.querySelector('.js-discussion, .discussion-timeline');
    if (timeline) {
      const container = document.createElement('div');
      container.className = 'bot-hider-container bot-hider-fixed';
      container.appendChild(this.toggleButton);

      // Insert at the very beginning of the timeline, before any comments
      const firstChild = timeline.firstElementChild;
      if (firstChild) {
        timeline.insertBefore(container, firstChild);
      } else {
        timeline.appendChild(container);
      }
      return;
    }

    // Strategy 4: Fallback - create floating button
    const container = document.createElement('div');
    container.className = 'bot-hider-container bot-hider-floating';
    container.appendChild(this.toggleButton);
    document.body.appendChild(container);
  }

  isFirstComment(commentElement) {
    // Check if this is the PR description (first comment)
    // Method 1: Look for issue permalink pattern
    const hasIssuePermalink = commentElement.querySelector('[id*="issue-"][id*="-permalink"]');
    if (hasIssuePermalink) return true;

    // Method 2: Check if it's the first timeline comment in the discussion
    const timeline = document.querySelector('.js-discussion, .discussion-timeline');
    if (timeline) {
      const firstComment = timeline.querySelector('.timeline-comment');
      if (firstComment === commentElement) return true;
    }

    // Method 3: Check for PR description indicators
    const hasOpeningComment = commentElement.querySelector('.js-comment-edit-button') &&
                              commentElement.closest('.js-discussion');
    if (hasOpeningComment) {
      // Check if this is among the first few elements in the discussion
      const allComments = document.querySelectorAll('.timeline-comment');
      const commentIndex = Array.from(allComments).indexOf(commentElement);
      if (commentIndex === 0) return true;
    }

    return false;
  }

  isBotComment(commentElement) {
    // EXCEPTION: Never hide the first comment (PR description) even if edited by bots
    const isFirstComment = this.isFirstComment(commentElement);
    if (isFirstComment) {
      return false;
    }

    // Debug: Log the element structure for troubleshooting
    if (window.location.search.includes('debug=bot-hider')) {
      console.log('Checking element:', commentElement);
      console.log('HTML:', commentElement.outerHTML.substring(0, 500));
    }

    // Priority 1: Look for any bot label that's directly associated with an author
    // This handles the specific case: <a class="author">name</a> <span class="Label Label--secondary">bot</span>
    const allBotLabels = commentElement.querySelectorAll('.Label--secondary');
    for (const label of allBotLabels) {
      if (label.textContent.toLowerCase().trim() === 'bot') {
        // Check if this bot label is near an author element (not in edit history)
        const nearbyAuthor = label.parentElement?.querySelector('.author') ||
                            label.previousElementSibling?.classList?.contains('author') ||
                            label.closest('strong')?.querySelector('.author');

        // Skip if this is in edit history
        if (label.closest('.js-comment-edit-history')) continue;

        if (nearbyAuthor) {
          return true;
        }
      }
    }

    // Priority 2: Check if the MAIN AUTHOR (not editor) has a bot label
    // Handle both regular comments and review comments
    const mainAuthorElement = commentElement.querySelector(
      '.timeline-comment-header h3 .author, .timeline-comment-header .author, ' +
      '.flex-auto .author, .review-comment-header .author, ' +
      '.discussion-item-header .author'
    );

    if (mainAuthorElement) {
      const mainAuthorContainer = mainAuthorElement.closest('strong') || mainAuthorElement.parentElement;
      const botLabel = mainAuthorContainer?.querySelector('.Label--secondary');
      if (botLabel && botLabel.textContent.toLowerCase().trim() === 'bot') {
        return true;
      }
    }

    // Priority 3: Check for GitHub Apps in main author URL
    if (mainAuthorElement) {
      const href = mainAuthorElement.getAttribute('href');
      if (href && href.includes('/apps/')) {
        return true;
      }

      // Check username patterns for main author
      const username = mainAuthorElement.textContent.trim();
      if (this.botIndicators.some(pattern => pattern.test(username))) {
        return true;
      }

      // Check specific bot users
      if (this.botUsers.includes(username)) {
        return true;
      }
    }

    // Priority 4: Check for other bot label variations (but not in edit history)
    const botLabels = commentElement.querySelectorAll(
      '.timeline-comment-header h3 .Label, .timeline-comment-header .Label, ' +
      '.flex-auto .Label, .review-comment-header .Label, ' +
      '.discussion-item-header .Label, strong .Label'
    );
    for (const label of botLabels) {
      // Skip labels that are in edit history sections
      if (label.closest('.js-comment-edit-history')) continue;

      const labelText = label.textContent.toLowerCase().trim();
      if (labelText === 'bot' || labelText === 'app' || labelText === 'service') {
        return true;
      }
    }

    // Priority 5: Check for automated commit messages or system messages
    const commentBody = commentElement.querySelector('.comment-body, .timeline-comment-text');
    if (commentBody) {
      const text = commentBody.textContent.toLowerCase();
      if (text.includes('automatically generated') ||
          text.includes('auto-generated') ||
          text.includes('this is an automated') ||
          text.includes('automated comment') ||
          text.includes('bot comment')) {
        return true;
      }
    }

    // Priority 6: Check for specific GitHub action indicators
    const actionIndicator = commentElement.querySelector('[title*="github-actions"], [alt*="github-actions"]');
    if (actionIndicator) return true;

    return false;
  }

  processExistingComments() {
    // Handle different types of GitHub comment elements
    const commentSelectors = [
      '.timeline-comment',           // Regular comments
      '.timeline-comment-group',     // Comment groups
      '.review-comment',             // Review comments
      '.js-review-comment',          // JS review comments
      '.js-comment',                 // General JS comments
      '.discussion-item',            // Discussion items
      '.js-discussion-item',         // JS discussion items
      '[data-testid="review-comment"]', // Test ID based selectors
      '.js-timeline-item',           // Timeline items that might contain comments
      '.js-review-thread',           // Review threads
      '.review-thread-component',    // Review thread components
      '[data-review-comment-id]',    // Elements with review comment IDs
      '.js-review-comment-component' // Review comment components
    ];

    const comments = document.querySelectorAll(commentSelectors.join(', '));

    comments.forEach(comment => {
      if (this.isBotComment(comment)) {
        this.hiddenComments.add(comment);
        if (this.isEnabled) {
          comment.classList.add('bot-comment-hidden');
        }
      }
    });

    this.updateToggleButton();
  }

  observeNewComments() {
    const commentSelectors = [
      '.timeline-comment',
      '.timeline-comment-group',
      '.review-comment',
      '.js-review-comment',
      '.js-comment',
      '.discussion-item',
      '.js-discussion-item',
      '[data-testid="review-comment"]',
      '.js-timeline-item'
    ].join(', ');

    this.observer = new MutationObserver((mutations) => {
      let foundNewBotComments = false;

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node is a comment
            if (node.matches && node.matches(commentSelectors)) {
              if (this.isBotComment(node)) {
                this.hiddenComments.add(node);
                if (this.isEnabled) {
                  node.classList.add('bot-comment-hidden');
                }
                foundNewBotComments = true;
              }
            }

            // Check for comments within the added node
            const newComments = node.querySelectorAll && node.querySelectorAll(commentSelectors);
            if (newComments) {
              newComments.forEach(comment => {
                if (this.isBotComment(comment)) {
                  this.hiddenComments.add(comment);
                  if (this.isEnabled) {
                    comment.classList.add('bot-comment-hidden');
                  }
                  foundNewBotComments = true;
                }
              });
            }
          }
        });
      });

      if (foundNewBotComments) {
        this.updateToggleButton();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  async toggleBotComments() {
    this.isEnabled = !this.isEnabled;
    
    // Save state
    await chrome.storage.sync.set({ botHiderEnabled: this.isEnabled });
    
    // Apply/remove hiding
    this.hiddenComments.forEach(comment => {
      if (this.isEnabled) {
        comment.classList.add('bot-comment-hidden');
      } else {
        comment.classList.remove('bot-comment-hidden');
      }
    });
    
    this.updateToggleButton();
  }

  updateToggleButton() {
    if (!this.toggleButton) return;
    
    const hiddenCount = this.hiddenComments.size;
    this.toggleButton.innerHTML = `
      <svg class="octicon" width="16" height="16" viewBox="0 0 16 16">
        <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14.5c-3.58 0-6.5-2.92-6.5-6.5S4.42 1.5 8 1.5s6.5 2.92 6.5 6.5-2.92 6.5-6.5 6.5z"/>
        <path fill="currentColor" d="M6.5 5.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm1.5 3.5c0 1.38-1.12 2.5-2.5 2.5h-1c-1.38 0-2.5-1.12-2.5-2.5"/>
      </svg>
      ${this.isEnabled ? 'Show' : 'Hide'} Bot Comments${hiddenCount > 0 ? ` (${hiddenCount})` : ''}
    `;
    this.toggleButton.title = `${this.isEnabled ? 'Show' : 'Hide'} bot comments${hiddenCount > 0 ? ` (${hiddenCount} found)` : ''}`;
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.toggleButton) {
      this.toggleButton.remove();
    }
  }
}

// Global instance for message handling
let botHiderInstance = null;

// Message handling for popup communication
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (!botHiderInstance) {
    sendResponse({ error: 'Extension not initialized' });
    return;
  }

  switch (request.action) {
    case 'toggle':
      botHiderInstance.isEnabled = request.enabled;
      botHiderInstance.hiddenComments.forEach(comment => {
        if (request.enabled) {
          comment.classList.add('bot-comment-hidden');
        } else {
          comment.classList.remove('bot-comment-hidden');
        }
      });
      botHiderInstance.updateToggleButton();
      sendResponse({ success: true });
      break;

    case 'getStats':
      sendResponse({
        stats: {
          hiddenCount: botHiderInstance.hiddenComments.size,
          totalCount: document.querySelectorAll('.timeline-comment, .timeline-comment-group, .review-comment, .js-review-comment, .js-comment, .discussion-item, .js-discussion-item, [data-testid="review-comment"], .js-timeline-item').length,
          enabled: botHiderInstance.isEnabled
        }
      });
      break;

    case 'showAll':
      botHiderInstance.isEnabled = false;
      botHiderInstance.hiddenComments.forEach(comment => {
        comment.classList.remove('bot-comment-hidden');
      });
      botHiderInstance.updateToggleButton();
      chrome.storage.sync.set({ botHiderEnabled: false });
      sendResponse({ success: true });
      break;

    case 'hideAll':
      botHiderInstance.isEnabled = true;
      botHiderInstance.hiddenComments.forEach(comment => {
        comment.classList.add('bot-comment-hidden');
      });
      botHiderInstance.updateToggleButton();
      chrome.storage.sync.set({ botHiderEnabled: true });
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ error: 'Unknown action' });
  }
});

// Initialize when DOM is ready
function initializeBotHider() {
  if (location.pathname.includes('/pull/')) {
    botHiderInstance = new GitHubBotHider();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeBotHider);
} else {
  initializeBotHider();
}

// Handle navigation in single-page app
let currentUrl = location.href;
new MutationObserver(() => {
  if (location.href !== currentUrl) {
    currentUrl = location.href;
    // Clean up previous instance
    if (botHiderInstance) {
      botHiderInstance.destroy();
      botHiderInstance = null;
    }
    // Reinitialize on navigation to PR pages
    setTimeout(() => {
      initializeBotHider();
    }, 1000);
  }
}).observe(document, { subtree: true, childList: true });
