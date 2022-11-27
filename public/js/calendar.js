/** 
 * 달력 팝업 
 * 
 */
var codefty = codefty || {};
codefty.calendar = {
    el : null,
    /**
     * 달력 팝업 노출 
     * 
     * @param {String} dateStr 선택 날짜
     * @param {String} mode cs - 상담일정 달력
    */
    show : function(dateStr, mode, target) {
        const date = dateStr?new Date(dateStr):new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        var url = "/calendar?year=" + year + "&month=" + month;
        if (mode) url += "&mode=" + mode;
        
        var div = document.createElement("div");
        var close = document.createElement("i");
        var iframe = document.createElement("iframe");
        div.className = "popup_calendar";
        div.style.width= "320px";
        div.style.height='400px';
        div.style.position='absolute';
        div.style.left = "15px";
        div.style.backgroundColor = "#ffffff";
        div.style.border = "1px solid #000000";
        div.style.borderRadius = "10px";
        div.style.overflow = "hidden";
        close.className = "xi-close close";
        close.style.position = "absolute";
        close.style.top = "15px";
        close.style.right = "15px";
        close.style.fontSize = "1.8rem";
        close.style.cursor = "pointer";
        iframe.src=url;
        iframe.width=320;
        iframe.height=400;
        iframe.setAttribute("frameborder", 0);
        iframe.setAttribute("scrolling", "no");
        div.appendChild(close);
        div.appendChild(iframe);
        var el = target.parentElement || document.body;
        el.style.position = el.style.position || "relative";
        el.appendChild(div);
        close.addEventListener("click", this.close);
        this.el = div;
    },
    close : function(e) {
        if (!e)
            return;
        
        var el = e.currentTarget.parentElement;
        if (el) el.parentElement.removeChild(el);
    }
};

window.addEventListener("DOMContentLoaded", function() {
    var datePickers = document.querySelectorAll(".datepicker");
    for (var i = 0; i < datePickers.length; i++) {
        datePickers[i].addEventListener("click", function(e) {
            var target = e.currentTarget;
            var dateStr = target.dataset.date;
            var mode = target.dataset.mode;
            codefty.calendar.show(dateStr, mode, target);
        });
    }
   
    /** 날짜 선택시 처리 */
    var days = document.querySelectorAll(".body-calendar .available");
    for (var i = 0; i < days.length; i++) {
        days[i].addEventListener("click", function(e) {
            var target = e.currentTarget;
            var data = {
                date : target.dataset.date,
                yoil : target.dataset.yoil,
                stamp : target.dataset.stamp,
            };
            if (typeof parent.callbackDatepicker == 'function') {
                parent.callbackDatepicker(data);
            }

            var el = parent.document.querySelector(".popup_calendar");
            if (el) el.parentElement.removeChild(el);
        });
    }

});
