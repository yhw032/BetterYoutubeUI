const toggle = document.getElementById('toggleGrid');

// Get the current state from storage and set the toggle
chrome.storage.sync.get(['isGridEnabled'], (result) => {
  toggle.checked = result.isGridEnabled === undefined ? true : result.isGridEnabled;
});

toggle.addEventListener('change', (event) => {
  const isGridEnabled = event.target.checked;

  // Save the new state
  chrome.storage.sync.set({ isGridEnabled });

  // Send a message to the active tab's content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // Check if the tab exists and has an ID
    if (tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleGrid', isGridEnabled }, (response) => {
        if (chrome.runtime.lastError) {
          // This error is expected if the content script is not on the current page
          // We can safely ignore it.
        }
      });
    }
  });
});

const fullscreenCommentsToggle = document.getElementById('toggleFullscreenComments');

// Get the current state from storage and set the toggle
chrome.storage.sync.get(['isFullscreenCommentsEnabled'], (result) => {
  fullscreenCommentsToggle.checked = result.isFullscreenCommentsEnabled === undefined ? false : result.isFullscreenCommentsEnabled;
});

fullscreenCommentsToggle.addEventListener('change', (event) => {
  const isFullscreenCommentsEnabled = event.target.checked;

  // Save the new state
  chrome.storage.sync.set({ isFullscreenCommentsEnabled });
});