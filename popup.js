// GitHub Bot Comment Hider - Popup Script

class PopupController {
  constructor() {
    this.isEnabled = true;
    this.currentTab = null;
    this.init();
  }

  async init() {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    this.currentTab = tab;

    // Check if we're on GitHub
    if (!this.isGitHubPR(tab.url)) {
      this.showNotGitHubMessage();
      return;
    }

    // Load saved state
    const result = await chrome.storage.sync.get(['botHiderEnabled']);
    this.isEnabled = result.botHiderEnabled !== false;

    this.setupEventListeners();
    this.updateUI();
    this.loadStats();
  }

  isGitHubPR(url) {
    return url && url.includes('github.com') && url.includes('/pull/');
  }

  showNotGitHubMessage() {
    document.getElementById('github-content').style.display = 'none';
    document.getElementById('not-github-content').style.display = 'block';
  }

  setupEventListeners() {
    // Toggle switch
    const toggleSwitch = document.getElementById('toggle-enabled');
    toggleSwitch.checked = this.isEnabled;
    toggleSwitch.addEventListener('change', (e) => {
      this.toggleExtension(e.target.checked);
    });

    // Action buttons
    document.getElementById('refresh-btn').addEventListener('click', () => {
      chrome.tabs.reload(this.currentTab.id);
      window.close();
    });

    document.getElementById('show-all-btn').addEventListener('click', () => {
      this.sendMessageToContentScript({ action: 'showAll' });
    });

    document.getElementById('hide-all-btn').addEventListener('click', () => {
      this.sendMessageToContentScript({ action: 'hideAll' });
    });

    document.getElementById('report-issue').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ 
        url: 'https://github.com/issues/new?title=Bot%20Comment%20Hider%20Issue&body=Please%20describe%20the%20issue%20you%20encountered.' 
      });
    });
  }

  async toggleExtension(enabled) {
    this.isEnabled = enabled;
    
    // Save state
    await chrome.storage.sync.set({ botHiderEnabled: enabled });
    
    // Send message to content script
    this.sendMessageToContentScript({ 
      action: 'toggle', 
      enabled: enabled 
    });
    
    this.updateUI();
  }

  updateUI() {
    const statusElement = document.getElementById('status');
    const statusText = document.getElementById('status-text');
    
    if (this.isEnabled) {
      statusElement.className = 'status enabled';
      statusText.textContent = 'Bot comments are hidden';
    } else {
      statusElement.className = 'status disabled';
      statusText.textContent = 'Bot comments are visible';
    }
  }

  async loadStats() {
    try {
      // Try to get stats from content script
      const response = await this.sendMessageToContentScript({ action: 'getStats' });
      
      if (response && response.stats) {
        document.getElementById('hidden-count').textContent = response.stats.hiddenCount || 0;
        document.getElementById('total-count').textContent = response.stats.totalCount || 0;
      } else {
        // Fallback: count comments directly
        this.countCommentsDirectly();
      }
    } catch (error) {
      console.log('Could not load stats:', error);
      document.getElementById('hidden-count').textContent = '?';
      document.getElementById('total-count').textContent = '?';
    }
  }

  async countCommentsDirectly() {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: this.currentTab.id },
        function: () => {
          const allComments = document.querySelectorAll('.timeline-comment, .timeline-comment-group');
          const hiddenComments = document.querySelectorAll('.bot-comment-hidden');
          return {
            total: allComments.length,
            hidden: hiddenComments.length
          };
        }
      });

      if (results && results[0] && results[0].result) {
        const { total, hidden } = results[0].result;
        document.getElementById('hidden-count').textContent = hidden;
        document.getElementById('total-count').textContent = total;
      }
    } catch (error) {
      console.log('Could not count comments:', error);
    }
  }

  async sendMessageToContentScript(message) {
    try {
      const response = await chrome.tabs.sendMessage(this.currentTab.id, message);
      return response;
    } catch (error) {
      console.log('Could not send message to content script:', error);
      return null;
    }
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.botHiderEnabled) {
    const toggleSwitch = document.getElementById('toggle-enabled');
    if (toggleSwitch) {
      toggleSwitch.checked = changes.botHiderEnabled.newValue;
    }
  }
});
