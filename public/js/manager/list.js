window.addEventListener("DOMContentLoaded", function() {
    var managerControlEls = document.getElementsByClassName("manager_control");
    for (var i = 0; i < managerControlEls.length; i++) {
        managerControlEls[i].addEventListener("click", function() {
            var id =  this.dataset.id;
            if (!id) {
                return;
            }
            var url = "/manager/controls/" + id;
            codefty.popup.open(url, "탈퇴/이용제한 관리", 550, 550, true);
        }); 
    }
}); 