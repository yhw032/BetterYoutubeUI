const DEBUG_MODE = 0;
showDebugLog("Starting Content Script");

function adjustLayout() {
    const windowWidth = window.innerWidth;
    const commentsElement = document.getElementById('comments');
    const relatedElement = document.getElementById('related');
    const belowElement = document.querySelector('ytd-watch-flexy #below');
    const secondElement = document.getElementById('secondary-inner');

    if (!commentsElement || !relatedElement || !belowElement || !secondElement) {
        showDebugLog("Elements not ready yet");
        return false; // Elements not ready
    }

    // Move related videos to below section, regardless of window size.
    if (!belowElement.contains(relatedElement)) {
        belowElement.appendChild(relatedElement);
        showDebugLog("Moved Related to below view");
    }

    if (windowWidth < 1000) {
        // Small screen: comments go below video.
        if (!belowElement.contains(commentsElement)) {
            belowElement.appendChild(commentsElement);
            showDebugLog("Moved Comments to below view");
        }
    } else {
        // Large screen: comments go to the side.
        if (!secondElement.contains(commentsElement)) {
            secondElement.prepend(commentsElement);
            showDebugLog("Moved Comments to secondary view");
        }
    }
    
    showDebugLog("Layout adjusted");
    return true; // Elements were ready and layout adjusted
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
        clearInterval(interval); // Stop trying after 10 seconds
        showDebugLog("Stopped trying to adjust layout after 10 seconds.");
    }, 10000);
}


function showDebugLog(msg) {
    if (DEBUG_MODE == 1) {
        msg = "[BetterYoutubeUI] " + msg;
        console.log(msg);
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

// Listen for YouTube's specific navigation event
document.addEventListener('yt-navigate-finish', run);

// Run on initial load
run();

window.addEventListener('resize', optimizedResizeHandler);