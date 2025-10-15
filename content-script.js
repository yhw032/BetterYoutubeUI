const DEBUG_MODE = 0;
showDebugLog("Starting Content Script");

const childListCallback = (mutationsList, observer) => {
    for (const mutation of mutationsList) {
        // if (window.location.href.indexOf("/shorts/") != -1 || window.innerWidth < 1000) {
        //     showDebugLog("Skipping");
        //     continue;
        // }

        if (mutation.type === 'childList') {
            const commentsTag = document.getElementById('comments');
            const relatedTag = document.getElementById('related');
            const secondTag = document.getElementById('secondary-inner');
            const belowTag = document.querySelector('ytd-watch-flexy #below');

            if (commentsTag && relatedTag) {
                const commentsParent = commentsTag.parentNode;
                const relatedParent = relatedTag.parentNode;

                if (commentsParent === secondTag && relatedParent === belowTag) {
                    return;
                }

                const fragment = document.createDocumentFragment();
                fragment.appendChild(commentsTag);
                fragment.appendChild(relatedTag);

                secondTag.appendChild(fragment.firstChild);
                belowTag.appendChild(fragment.lastChild);

                showDebugLog("Swapping Comments/Related Position");
                observer.disconnect();
            }
        }
    }
};


const targetNode = document.body;

const childListObserver = new MutationObserver(childListCallback);
const childListConfig = { childList: true };
childListObserver.observe(targetNode, childListConfig);

// const attributesObserver = new MutationObserver(attributesCallback);
// const attributesConfig = { attributes: true };
// attributesObserver.observe(targetNode, attributesConfig);

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

    if (windowWidth < 1000 && commentsElement) {
        belowElement.appendChild(relatedElement);
        belowElement.appendChild(commentsElement);
    } else {
        secondElement.appendChild(commentsElement);
        belowElement.appendChild(relatedElement);
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

window.addEventListener('resize', optimizedResizeHandler);

