const DEBUG_MODE = 0;
showDebugLog("Starting Content Script");

const disableFullscreenScroll = () => {
    const player = document.querySelector('.html5-video-player');
    if (player) {
        if (player.classList.contains('ytp-grid-scrollable')) {
            player.classList.remove('ytp-grid-scrollable');
            showDebugLog("Removed ytp-grid-scrollable from player");
        }
        
        player.style.setProperty('--ytp-grid-scroll-percentage', '0', 'important');
        player.style.setProperty('--ytp-grid-peek-height', '0px', 'important');
    }
    
    const gridElements = document.querySelectorAll('.ytp-fullscreen-grid, .ytp-fullscreen-grid-main-content, .ytp-fullscreen-grid-stills-container, .ytp-modern-videowall-still');
    gridElements.forEach(el => {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.remove();
    });

    const panels = document.querySelectorAll('.ytp-fullerscreen-edu-panel, .ytp-cards-teaser, div[class*="fullerscreen"]');
    panels.forEach(panel => {
        panel.style.display = 'none';
        panel.style.visibility = 'hidden';
        panel.remove();
    });
}

const attributesCallback = (mutationsList, observer) => {
    for (const mutation of mutationsList) {
        if (mutation.attributeName !== 'fullscreen') continue;

        const isFullscreen = mutation.target.hasAttribute('fullscreen');
        const fullScreenVideo = document.querySelector(".html5-main-video");
        const commentsTag = document.getElementById('comments');
        let scrollPosBefore = commentsTag ? commentsTag.scrollTop : 0;

        if (isFullscreen) {
            if (!isFullscreenCommentsFeatureEnabled) return;
            showDebugLog("Entering Fullscreen");

            const fullScreenCommentBtn = createFullScreenCommentButton();
            const rightControlTag = document.querySelector(".ytp-right-controls-left");

            if (rightControlTag && !document.getElementById("byui-comment-button")) {
                showDebugLog("Insert Comment Button");
                //rightControlTag.insertBefore(fullScreenCommentBtn, rightControlTag.children[1]);
                rightControlTag.appendChild(fullScreenCommentBtn);

                fullScreenCommentBtn.addEventListener('click', function () {
                    showDebugLog("Comment Button Clicked");

                    let scrollPos = scrollPosBefore ? scrollPosBefore : (commentsTag ? commentsTag.scrollTop : 0);
                    scrollPosBefore = 0;
                    toggleComments(fullScreenVideo, commentsTag, scrollPos);

                });
            }
        } else {
            showDebugLog("Exiting Fullscreen");
            const fullScreenCommentBtn = document.getElementById("byui-comment-button");

            if (fullScreenVideo && fullScreenVideo.classList.contains('byui-align-video-left')) {
                fullScreenVideo.classList.remove('byui-align-video-left');
            }

            if (fullScreenCommentBtn) {
                fullScreenCommentBtn.remove();
            }

            resetComments(commentsTag, scrollPosBefore);
        }
    }
};


function createFullScreenCommentButton() {
    const fullScreenCommentBtn = document.createElement("button");
    const fullScreenCommentIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const fullScreenCommentIconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");

    fullScreenCommentBtn.id = "byui-comment-button";
    fullScreenCommentBtn.classList.add("ytp-button");
    fullScreenCommentBtn.setAttribute("aria-label", "Comments");


    fullScreenCommentIcon.setAttributeNS(null, "height", "24");
    fullScreenCommentIcon.setAttributeNS(null, "version", "1.1");
    fullScreenCommentIcon.setAttributeNS(null, "viewBox", "0 0 24 24");
    fullScreenCommentIcon.setAttributeNS(null, "width", "24");
    fullScreenCommentIcon.setAttributeNS(null, "fill-opacity", "1");

    fullScreenCommentIconPath.setAttributeNS(null, "d", "M5.25,18 C3.45507456,18 2,16.5449254 2,14.75 L2,6.25 C2,4.45507456 3.45507456,3 5.25,3 L18.75,3 C20.5449254,3 22,4.45507456 22,6.25 L22,14.75 C22,16.5449254 20.5449254,18 18.75,18 L13.0124851,18 L7.99868152,21.7506795 C7.44585139,22.1641649 6.66249789,22.0512036 6.2490125,21.4983735 C6.08735764,21.2822409 6,21.0195912 6,20.7499063 L5.99921427,18 L5.25,18 Z M12.5135149,16.5 L18.75,16.5 C19.7164983,16.5 20.5,15.7164983 20.5,14.75 L20.5,6.25 C20.5,5.28350169 19.7164983,4.5 18.75,4.5 L5.25,4.5 C4.28350169,4.5 3.5,5.28350169 3.5,6.25 L3.5,14.75 C3.5,15.7164983 4.28350169,16.5 5.25,16.5 L7.49878573,16.5 L7.49899997,17.2497857 L7.49985739,20.2505702 L12.5135149,16.5 Z");
    fullScreenCommentIconPath.setAttributeNS(null, "fill", "#fff");
    fullScreenCommentIcon.appendChild(fullScreenCommentIconPath);
    fullScreenCommentBtn.appendChild(fullScreenCommentIcon);

    return fullScreenCommentBtn;
}


function toggleComments(fullScreenVideo, commentsTagP, scrollPos) {
    let commentsTag = commentsTagP;
    if (!commentsTag) {
        commentsTag = document.getElementById('comments');
        if (!commentsTag) return;
    }

    const playerContainer = document.getElementById('movie_player');
    //const playerContainer = document.getElementById('full-bleed-container')
    if (!playerContainer) return;

    if (!commentsTag.classList.contains("byui-fullscreen-comment")) {
        showDebugLog("Change Comment Style to Fullscreen");
        commentsTag.classList.add("byui-fullscreen-comment");
        playerContainer.prepend(commentsTag);
        if (fullScreenVideo) fullScreenVideo.classList.add('byui-align-video-left');
        commentsTag.scrollTop = scrollPos;
        document.body.classList.add('byui-no-scroll');
    } else {
        showDebugLog("Recover Comment Style from Fullscreen");
        const secondaryInner = document.getElementById('secondary-inner');
        if (!secondaryInner) return;
        commentsTag.classList.remove("byui-fullscreen-comment");
        secondaryInner.appendChild(commentsTag);
        if (fullScreenVideo) fullScreenVideo.classList.remove('byui-align-video-left');
        commentsTag.scrollTop = scrollPos;
        document.body.classList.remove('byui-no-scroll');
    }
}


function getCurrentScrollPos() {
    const commentsTag = document.getElementById('comments');
    return commentsTag ? commentsTag.scrollTop : 0;
}

function resetComments(commentsTagP, scrollPos) {
    let commentsTag = commentsTagP;
    if (!commentsTag) {
        commentsTag = document.getElementById('comments');
        if (!commentsTag) return;
    }

    const secondaryInner = document.getElementById('secondary-inner');
    if (!secondaryInner) return;

    if (commentsTag.classList.contains("byui-fullscreen-comment")) {
        commentsTag.classList.remove("byui-fullscreen-comment");
        secondaryInner.appendChild(commentsTag);
        document.body.classList.remove('byui-no-scroll');
    }

    if (scrollPos) {
        setTimeout(() => {
            commentsTag.scrollTop = scrollPos;
        }, 300);
    }
}

function adjustLayout() {
    if (window.location.href.includes('/shorts/')) return true;

    const commentsElement = document.getElementById('comments');
    const relatedElement = document.getElementById('related');
    const belowElement = document.querySelector('ytd-watch-flexy #below');
    const secondElement = document.getElementById('secondary-inner');

    if (!commentsElement || !relatedElement || !belowElement || !secondElement) {
        showDebugLog("Elements not ready yet for layout adjustment.");
        return false;
    }

    if (!belowElement.contains(relatedElement)) {
        belowElement.appendChild(relatedElement);
        showDebugLog("Moved Related to below view");
    }

    if (window.innerWidth < 1000) {
        if (!belowElement.contains(commentsElement)) {
            belowElement.appendChild(commentsElement);
            showDebugLog("Moved Comments to below view");
        }
    } else {
        if (!secondElement.contains(commentsElement)) {
            secondElement.appendChild(commentsElement);
            showDebugLog("Moved Comments to secondary view");
        }
    }
    
    showDebugLog("Layout adjusted");
    return true;
}

function run() {
    if (window.location.href.includes('/shorts/')) {
        showDebugLog("Skipping, on shorts");
        return;
    }

    const interval = setInterval(() => {
        if (adjustLayout()) {
            showDebugLog("Initial layout setup finished.");
            clearInterval(interval);
        }
    }, 500);

    setTimeout(() => {
        clearInterval(interval);
        showDebugLog("Stopped trying to adjust layout after 10 seconds.");
    }, 10000);

    disableFullscreenScroll();
    observeFullscreenChanges();
}


function showDebugLog(msg) {
    if (DEBUG_MODE == 1) {
        console.log(`[BetterYoutubeUI] ${msg}`);
    }
}

const optimizedResizeHandler = debounce(adjustLayout, 200);

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

const fullscreenObserver = new MutationObserver(attributesCallback);

function observeFullscreenChanges() {
    const targetNode = document.querySelector('ytd-watch-flexy');
    if (targetNode) {
        const config = { attributes: true, attributeFilter: ['fullscreen'] };
        fullscreenObserver.observe(targetNode, config);
        showDebugLog("Observer is watching for fullscreen changes on ytd-watch-flexy.");
    } else {
        showDebugLog("Observer target 'ytd-watch-flexy' not found. Retrying in 1s.");
        setTimeout(observeFullscreenChanges, 1000);
    }
}

document.addEventListener('yt-navigate-start', () => {
    fullscreenObserver.disconnect();
    showDebugLog("Fullscreen observer disconnected.");
});

document.addEventListener('yt-navigate-finish', run);
run();
window.addEventListener('resize', optimizedResizeHandler);

let isFullscreenCommentsFeatureEnabled = false;

// Get initial state from storage
chrome.storage.sync.get(['isFullscreenCommentsEnabled'], (result) => {
  isFullscreenCommentsFeatureEnabled = result.isFullscreenCommentsEnabled === undefined ? false : result.isFullscreenCommentsEnabled;
  showDebugLog(`Fullscreen comments feature is ${isFullscreenCommentsFeatureEnabled ? 'enabled' : 'disabled'}`);
});

// Listen for changes in storage
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.isFullscreenCommentsEnabled) {
    isFullscreenCommentsFeatureEnabled = !!changes.isFullscreenCommentsEnabled.newValue;
    showDebugLog(`Fullscreen comments feature changed to ${isFullscreenCommentsFeatureEnabled ? 'enabled' : 'disabled'}`);
    // If the feature is disabled, remove the button if it exists
    if (!isFullscreenCommentsFeatureEnabled) {
      const fullScreenCommentBtn = document.getElementById("byui-comment-button");
      if (fullScreenCommentBtn) {
        fullScreenCommentBtn.remove();
      }
    }
  }
});

function toggleGridClass(isEnabled) {
  document.body.classList.toggle('byui-related-view', isEnabled);
}

chrome.storage.sync.get(['isGridEnabled'], (result) => {
  const isEnabled = result.isGridEnabled !== false;
  toggleGridClass(isEnabled);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleGrid') {
    toggleGridClass(request.isGridEnabled);
  }
});
