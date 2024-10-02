const DEBUG_MODE = 1;
showDebugLog("Starting 000");

const callback = (mutationsList, observer) => {
    for (const mutation of mutationsList) {
        if(window.location.href.indexOf("/shorts/") != -1){
            showDebugLog("Skipping 001");
            continue;
        }

        if (mutation.type === 'childList') {
            const commentsTag = document.getElementById('comments');
            const relatedTag = document.getElementById('related');

            if (commentsTag && relatedTag) {
                const secondTag = document.getElementById('secondary-inner');
                const belowTag = document.querySelector('ytd-watch-flexy #below');

                if(secondTag.querySelector('#comments') == null && document.querySelector('#movie_player #comments') == null){
                showDebugLog("Swapping 002");
                secondTag.appendChild(commentsTag);
                belowTag.appendChild(relatedTag);
                }
            }
        }
        
        if (mutation.type === 'attributes') {
            const fullScreenTag = document.querySelector('[fullscreen]');
            const fullScreenVideo = document.getElementsByClassName("html5-main-video")[0];

            if(fullScreenTag) {
                showDebugLog("FullScreen: " + mutation.attributes + " / 003");

                const fullScreenCommentBtn = document.createElement("button");
                const fullScreenCommentIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                const fullScreenCommentIconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
                
                const rightControlTag = document.getElementsByClassName("ytp-right-controls")[0];
                
                
                fullScreenCommentBtn.id = "byui-comment-button";
                fullScreenCommentBtn.classList.add("ytp-button");

                fullScreenCommentIcon.setAttributeNS(null, "height", "100%");
                fullScreenCommentIcon.setAttributeNS(null, "version", "1.1");
                fullScreenCommentIcon.setAttributeNS(null, "viewBox", "0 0 36 36");
                fullScreenCommentIcon.setAttributeNS(null, "width", "100%");
                fullScreenCommentIcon.setAttributeNS(null, "fill-opacity", "1");
                
                fullScreenCommentIconPath.setAttributeNS(null, "d", "M5.25,18 C3.45507456,18 2,16.5449254 2,14.75 L2,6.25 C2,4.45507456 3.45507456,3 5.25,3 L18.75,3 C20.5449254,3 22,4.45507456 22,6.25 L22,14.75 C22,16.5449254 20.5449254,18 18.75,18 L13.0124851,18 L7.99868152,21.7506795 C7.44585139,22.1641649 6.66249789,22.0512036 6.2490125,21.4983735 C6.08735764,21.2822409 6,21.0195912 6,20.7499063 L5.99921427,18 L5.25,18 Z M12.5135149,16.5 L18.75,16.5 C19.7164983,16.5 20.5,15.7164983 20.5,14.75 L20.5,6.25 C20.5,5.28350169 19.7164983,4.5 18.75,4.5 L5.25,4.5 C4.28350169,4.5 3.5,5.28350169 3.5,6.25 L3.5,14.75 C3.5,15.7164983 4.28350169,16.5 5.25,16.5 L7.49878573,16.5 L7.49899997,17.2497857 L7.49985739,20.2505702 L12.5135149,16.5 Z");
                fullScreenCommentIconPath.setAttributeNS(null, "fill", "#fff");
                fullScreenCommentIcon.appendChild(fullScreenCommentIconPath);
                fullScreenCommentBtn.appendChild(fullScreenCommentIcon);

                if(!document.getElementById("byui-comment-button")){
                    showDebugLog("Insert Comment Button 004");
                    rightControlTag.insertBefore(fullScreenCommentBtn, rightControlTag.children[1]);
                }
                //document.querySelector('#player-full-bleed-container .ytp-right-controls').appendChild(fullScreenCommentBtn);

                document.getElementById('byui-comment-button').addEventListener('click', function(){
                    showDebugLog("Click Check 005");

                    if(document.querySelectorAll(".ytp-live-badge[disabled]").length != 0){  //라이브 영상
                        
                        const liveChatTag = document.getElementById('chat-container');
                        if(!liveChatTag.classList.contains("byui-fullscreen-live-chat")){
                            liveChatTag.classList.add("byui-fullscreen-live-chat");
                            document.getElementById('movie_player').appendChild(liveChatTag);
                        } else {
                            liveChatTag.classList.remove("byui-fullscreen-live-chat");
                            document.getElementById('secondary-inner').appendChild(liveChatTag);
                        }
                    } else {        //일반 영상 --------------------------------------------------------------------
                        
                        const commentsTag = document.getElementById('comments');

                        if(!commentsTag.classList.contains("byui-fullscreen-comment")){
                            showDebugLog("Change Comment Style 006");
                            
                            let scrollPos = commentsTag.scrollTop;
                            commentsTag.classList.add("byui-fullscreen-comment");
                            document.getElementById('movie_player').appendChild(commentsTag);
                            fullScreenVideo.classList.add('byui-align-video-left');
                            commentsTag.scrollTop = scrollPos;
                        } 
                        
                        else {
                            showDebugLog("Recover Comment Style 007");

                            let scrollPos = commentsTag.scrollTop;
                            commentsTag.classList.remove("byui-fullscreen-comment");
                            document.getElementById('secondary-inner').appendChild(commentsTag);
                            fullScreenVideo.classList.remove('byui-align-video-left');
                            commentsTag.scrollTop = scrollPos;
                        }
                    }

                    
                    showDebugLog("Comments/Chat Moving Video Section By Click 008");
                });
            } else {
                const fullScreenCommentBtn = document.getElementById("byui-comment-button");

                if(fullScreenVideo.classList.contains('byui-align-video-left')){
                    fullScreenVideo.classList.remove('byui-align-video-left');
                }

                if (fullScreenCommentBtn){
                    fullScreenCommentBtn.remove();
                }
                
                if(document.querySelectorAll(".ytp-live-badge[disabled]").length != 0){    //라이브 영상 ---------
                    const liveChatTag = document.getElementById('chat-container');
                    const videoTag = document.querySelector("#player-container[role='complementary']");

                    liveChatTag.classList.remove("byui-fullscreen-live-chat");
                    document.getElementById('secondary-inner').appendChild(liveChatTag);
                    document.getElementById('player-container-inner').appendChild(videoTag);
                } else { //일반 영상 ------------------------------------------------------------------------
                    const commentsTag = document.getElementById('comments');

                    if(commentsTag && commentsTag.classList.contains("byui-fullscreen-comment")){
                        let scrollPos = commentsTag.scrollTop;

                        commentsTag.classList.remove("byui-fullscreen-comment");
                        document.getElementById('secondary-inner').appendChild(commentsTag);

                        commentsTag.scrollTop = scrollPos;
                    } 
                }
                showDebugLog("Comments Moving Secondary 010");
            }
        }
    }
};


const targetNode = document.body;
const observer = new MutationObserver(callback);
const config = { childList: true, attributes: true };
observer.observe(targetNode, config);


function showDebugLog(msg) {
    if(DEBUG_MODE == 1) {
        msg = "[BetterYoutubeUI] " + msg;
        console.log(msg);
    }
}
