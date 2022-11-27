/**
 * 공통 치환코드 관리
 * 
 */
const commonCode = {
    /**
     * 추가
     * @param {*} e 
     */
    add(e) {
        const targetEl = document.querySelector("#frmSave tbody");
        const html = document.getElementById("tpl").innerHTML;
        if (!targetEl || !html) {
            return;
        }

        const domParser = new DOMParser();
        const dom = domParser.parseFromString(html, "text/html");
        const trEl = dom.querySelector("tr");
        targetEl.appendChild(trEl);

        const removeEl = trEl.querySelector(".remove");
        removeEl.addEventListener("click", commonCode.removeRow);
    },
    /**
     * 마지막 항목 삭제 
     * 
     * @param {*} e 
     */
    removeLast(e) {
        const trEl = document.querySelector("#frmSave tbody tr:last-of-type");
        if (trEl) trEl.parentElement.removeChild(trEl);
    },
    /**
     * 현재 항목 삭제
     * 
     * @param {*} e 
     */
    removeRow(e) {
        const el = e.currentTarget;
        const trEl = el.parentElement.parentElement;
        if (trEl) trEl.parentElement.removeChild(trEl);
    }
};

window.addEventListener("DOMContentLoaded", function() {
    // 추가
    const addRowEl = document.getElementById("add_row");
    if (addRowEl) {
        addRowEl.addEventListener("click", commonCode.add);
    }

    // 마지막 항목 삭제
    const deleteRowEl = document.getElementById("delete_row");
    if (deleteRowEl) {
        deleteRowEl.addEventListener("click", commonCode.removeLast);
    }

    // 현재 항목 삭제
    const removeEls = document.querySelectorAll("#frmSave .remove");
    for (const el of removeEls) {
       el.addEventListener("click", commonCode.removeRow);
    }
        
});