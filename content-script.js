const DEBUG_MODE = 0;
let isFullscreenCommentsFeatureEnabled = false;
let navigating = false;
let observedWatch = null;
let fullscreenActive = false;
let restoreVersion = 0;
let restoreTimer = null;
let layoutInterval = null;
let layoutDeadline = null;
let resizeTimer = null;
let openedComments = null;
let openedVideo = null;
let originalParent = null;
let featureSettingChanged = false;
let gridSettingChanged = false;

function showDebugLog(message) {
    if (DEBUG_MODE) console.log('[BetterYoutubeUI] ' + message);
}

function isWatchPage() {
    return !navigating && new URL(window.location.href).pathname === '/watch';
}

function currentWatch() {
    return isWatchPage() ? document.querySelector('ytd-watch-flexy') : null;
}

function canOpenComments() {
    return isFullscreenCommentsFeatureEnabled && !!currentWatch()?.hasAttribute('fullscreen');
}

// Incrementing the version also invalidates storage callbacks that have not returned yet.
function cancelRestore() {
    restoreVersion++;
    clearTimeout(restoreTimer);
    restoreTimer = null;
}

function stopFullscreenCommentWheelPropagation(event) {
    event.stopPropagation();
}

function commentDestination() {
    const watch = currentWatch();
    if (!watch) return null;
    const below = watch.querySelector('#below');
    const secondary = watch.querySelector('#secondary-inner');
    return window.innerWidth < 1000 ? (below || secondary) : (secondary || below);
}

function openComments() {
    if (!canOpenComments()) return false;
    const watch = currentWatch();
    const comments = watch.querySelector('#comments');
    const player = watch.querySelector('#movie_player');
    if (!comments || !player) return false;
    if (comments.classList.contains('byui-fullscreen-comment')) return true;

    const scrollTop = comments.scrollTop;
    openedComments = comments;
    openedVideo = watch.querySelector('.html5-main-video');
    originalParent = comments.parentNode;
    comments.classList.add('byui-fullscreen-comment');
    comments.addEventListener('wheel', stopFullscreenCommentWheelPropagation);
    player.prepend(comments);
    openedVideo?.classList.add('byui-align-video-left');
    document.body.classList.add('byui-no-scroll');
    comments.scrollTop = scrollTop;
    return true;
}

// Closing the UI does not erase the user's preference to restore it next time.
function closeComments() {
    const comments = openedComments;
    openedVideo?.classList.remove('byui-align-video-left');
    document.body.classList.remove('byui-no-scroll');
    if (comments) {
        const scrollTop = comments.scrollTop;
        comments.classList.remove('byui-fullscreen-comment');
        comments.removeEventListener('wheel', stopFullscreenCommentWheelPropagation);
        const destination = commentDestination() || (originalParent?.isConnected ? originalParent : null);
        if (destination && comments.parentNode !== destination) destination.appendChild(comments);
        comments.scrollTop = scrollTop;
    }
    openedComments = null;
    openedVideo = null;
    originalParent = null;
}

function toggleComments() {
    cancelRestore();
    if (!canOpenComments()) return;
    if (openedComments) {
        closeComments();
        chrome.storage.sync.set({ commentWindowState: false });
    } else if (openComments()) {
        chrome.storage.sync.set({ commentWindowState: true });
    }
}

function clearFullscreenUI() {
    cancelRestore();
    document.getElementById('byui-comment-button')?.remove();
    closeComments();
    fullscreenActive = false;
}

function syncFullscreenUI() {
    if (!canOpenComments()) {
        clearFullscreenUI();
        return;
    }
    const watch = currentWatch();
    const controls = watch.querySelector('.ytp-right-controls-left') || watch.querySelector('.ytp-right-controls');
    if (controls && !document.getElementById('byui-comment-button')) {
        const button = createFullScreenCommentButton();
        button.addEventListener('click', toggleComments);
        controls.appendChild(button);
    }
    if (fullscreenActive) return;
    fullscreenActive = true;
    cancelRestore();
    const version = restoreVersion;
    chrome.storage.sync.get(['commentWindowState'], (result) => {
        if (version !== restoreVersion || !canOpenComments() || currentWatch() !== watch) return;
        if (result.commentWindowState !== true) return;
        restoreTimer = setTimeout(() => {
            restoreTimer = null;
            if (version === restoreVersion && canOpenComments() && currentWatch() === watch) {
                openComments();
            }
        }, 300);
    });
}

function createFullScreenCommentButton() {
    const fullScreenCommentBtn = document.createElement("button");
    const fullScreenCommentIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const fullScreenCommentIconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");

    fullScreenCommentBtn.id = "byui-comment-button";
    fullScreenCommentBtn.classList.add("ytp-button");
    fullScreenCommentBtn.setAttribute("aria-label", chrome.i18n.getMessage("viewComments") || "댓글 보기 b");
    fullScreenCommentBtn.setAttribute("data-tooltip-target-id", "byui-comment-button");
    fullScreenCommentBtn.setAttribute("data-tooltip-title", chrome.i18n.getMessage("viewCommentsTooltip") || "댓글 보기(b)");


    fullScreenCommentIcon.setAttributeNS(null, "fill", "none");
    fullScreenCommentIcon.setAttributeNS(null, "height", "24");
    fullScreenCommentIcon.setAttributeNS(null, "viewBox", "0 0 24 24");
    fullScreenCommentIcon.setAttributeNS(null, "width", "24");

    fullScreenCommentIconPath.setAttributeNS(null, "d", "M5.25,18 C3.45507456,18 2,16.5449254 2,14.75 L2,6.25 C2,4.45507456 3.45507456,3 5.25,3 L18.75,3 C20.5449254,3 22,4.45507456 22,6.25 L22,14.75 C22,16.5449254 20.5449254,18 18.75,18 L13.0124851,18 L7.99868152,21.7506795 C7.44585139,22.1641649 6.66249789,22.0512036 6.2490125,21.4983735 C6.08735764,21.2822409 6,21.0195912 6,20.7499063 L5.99921427,18 L5.25,18 Z M12.5135149,16.5 L18.75,16.5 C19.7164983,16.5 20.5,15.7164983 20.5,14.75 L20.5,6.25 C20.5,5.28350169 19.7164983,4.5 18.75,4.5 L5.25,4.5 C4.28350169,4.5 3.5,5.28350169 3.5,6.25 L3.5,14.75 C3.5,15.7164983 4.28350169,16.5 5.25,16.5 L7.49878573,16.5 L7.49899997,17.2497857 L7.49985739,20.2505702 L12.5135149,16.5 Z");
    fullScreenCommentIconPath.setAttributeNS(null, "fill", "#fff");
    fullScreenCommentIcon.appendChild(fullScreenCommentIconPath);
    fullScreenCommentBtn.appendChild(fullScreenCommentIcon);

    return fullScreenCommentBtn;
}


function adjustLayout() {
    const watch = currentWatch();
    if (!watch) return false;
    const comments = watch.querySelector('#comments');
    const related = watch.querySelector('#related');
    const below = watch.querySelector('#below');
    const destination = commentDestination();
    // Related videos can still be positioned when comments are unavailable.
    if (related && below && !below.contains(related)) below.appendChild(related);
    if (comments && destination && !comments.classList.contains('byui-fullscreen-comment') && !destination.contains(comments)) {
        const scrollTop = comments.scrollTop;
        destination.appendChild(comments);
        comments.scrollTop = scrollTop;
    }
    return !!(comments && related && below && destination);
}

const fullscreenObserver = new MutationObserver(() => {
    syncFullscreenUI();
    adjustLayout();
});

function stopLayoutPolling() {
    clearInterval(layoutInterval);
    clearTimeout(layoutDeadline);
    layoutInterval = null;
    layoutDeadline = null;
}

function cleanupPage() {
    stopLayoutPolling();
    clearTimeout(resizeTimer);
    resizeTimer = null;
    fullscreenObserver.disconnect();
    observedWatch = null;
    clearFullscreenUI();
}

function setupPage() {
    const watch = currentWatch();
    if (!watch) return false;
    if (watch !== observedWatch) {
        fullscreenObserver.disconnect();
        clearFullscreenUI();
        observedWatch = watch;
        fullscreenObserver.observe(watch, { attributes: true, attributeFilter: ['fullscreen'] });
    }
    const ready = adjustLayout();
    syncFullscreenUI();
    const controlsReady = !canOpenComments() || !!document.getElementById('byui-comment-button');
    return ready && controlsReady;
}

function run() {
    cleanupPage();
    navigating = false;
    if (!isWatchPage() || setupPage()) return;
    layoutInterval = setInterval(() => {
        if (setupPage()) stopLayoutPolling();
    }, 500);
    layoutDeadline = setTimeout(stopLayoutPolling, 10000);
}

document.addEventListener('yt-navigate-start', () => {
    // Restore nodes while the old page is still available.
    cleanupPage();
    navigating = true;
});
document.addEventListener('yt-navigate-finish', run);
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    if (!isWatchPage()) return;
    resizeTimer = setTimeout(() => {
        resizeTimer = null;
        adjustLayout();
    }, 200);
});

document.addEventListener('keydown', (event) => {
    if (!canOpenComments() || event.repeat || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return;
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
    if (event.key.toLowerCase() === 'b') {
        event.preventDefault();
        toggleComments();
    }
});

function toggleGridClass(enabled) {
    document.body.classList.toggle('byui-related-view', enabled);
}

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== 'sync') return;
    if (changes.isFullscreenCommentsEnabled) {
        featureSettingChanged = true;
        isFullscreenCommentsFeatureEnabled = changes.isFullscreenCommentsEnabled.newValue === true;
        syncFullscreenUI();
        adjustLayout();
    }
    if (changes.isGridEnabled) {
        gridSettingChanged = true;
        toggleGridClass(changes.isGridEnabled.newValue !== false);
    }
});

chrome.storage.sync.get(['isFullscreenCommentsEnabled', 'isGridEnabled'], (result) => {
    // A newer change event must win over a delayed initial read.
    if (!featureSettingChanged) isFullscreenCommentsFeatureEnabled = result.isFullscreenCommentsEnabled === true;
    if (!gridSettingChanged) toggleGridClass(result.isGridEnabled !== false);
    syncFullscreenUI();
});

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'toggleGrid') {
        gridSettingChanged = true;
        toggleGridClass(request.isGridEnabled !== false);
    }
});

run();
