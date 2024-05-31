const toggleBtnTag = document.getElementById('toggleBtn');

document.addEventListener('change', function(){
    toggleBtnTag.addEventListener('change', function() {
        if(toggleBtnTag.checked){
            whale.runtime.sendMessage("byuiFullScreenComment_on");
        } else {
            whale.runtime.sendMessage("byuiFullScreenComment_off");
        }
    });
})
