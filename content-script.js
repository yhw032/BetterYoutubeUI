const DEBUG_MODE = 0;
showDebugLog("Starting Content Script");

function run() {
    if (window.location.href.includes('/shorts/') || window.innerWidth < 1000) {
        showDebugLog("Skipping, either on shorts or window is too small");
        return;
    }

    const interval = setInterval(() => {
        const commentsTag = document.getElementById('comments');
        const relatedTag = document.getElementById('related');
        const secondTag = document.getElementById('secondary-inner');
        const belowTag = document.querySelector('ytd-watch-flexy #below');

        if (commentsTag && relatedTag && secondTag && belowTag) {
            if (secondTag.contains(commentsTag)) {
                // Already in the correct position
                clearInterval(interval);
                return;
            }
            
            secondTag.prepend(commentsTag);
            showDebugLog("Moved Comments to secondary view");
            clearInterval(interval);
        }
    }, 500);

    setTimeout(() => clearInterval(interval), 10000); // Stop trying after 10 seconds
}


function showDebugLog(msg) {
    if (DEBUG_MODE == 1) {
        msg = "[BetterYoutubeUI] " + msg;
        console.log(msg);
    }
}

const optimizedResizeHandler = debounce(() => {
    const windowWidth = window.innerWidth;
    const commentsElement = document.getElementById('comments');
    const relatedElement = document.getElementById('related');
    const belowElement = document.querySelector('ytd-watch-flexy #below');
    const secondElement = document.getElementById('secondary-inner');

    if (!commentsElement || !relatedElement || !belowElement || !secondElement) return;

    if (windowWidth < 1000) {
        if (!belowElement.contains(commentsElement)) {
            belowElement.appendChild(commentsElement);
        }
    } else {
        if (!secondElement.contains(commentsElement)) {
            secondElement.prepend(commentsElement);
        }
    }
}, 200);

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


