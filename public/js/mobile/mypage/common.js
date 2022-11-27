/** 공통 이벤트 처리 S */
window.addEventListener("DOMContentLoaded", function() {
    /** 날짜 검색 S */
    const frmMSearchEl = document.getElementById("frmMSearch");
    const quickDateEls = document.getElementsByClassName("date_span");
    if (frmMSearchEl) {
        for (let el of quickDateEls) {
            el.addEventListener("click", function() {
                const span = this.dataset.span;
                frmMSearch.dateType.value=span;
                setTimeout(function() {
                  frmMSearchEl.submit();
                }, 500);
            });
        }

        const quickDateSelEls = document.getElementsByName("quick_date_sel");
        for (let el of quickDateSelEls) {
            el.addEventListener("change", function() {
                const v = this.value;
                frmMSearch.dateType.value=v;
                setTimeout(function() {
                    frmMSearchEl.submit();
                }, 500);
            });
        }
    }

    
    /** 날짜 검색 E */
});
/** 공통 이벤트 처리 E */