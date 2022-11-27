const tplForm = {
    // 추가 
    add(e) {
        const targetEl = document.getElementById("buttons_html");
        let html = document.getElementById("tpl_buttons").innerHTML
        const domParser = new DOMParser();
        const dom = domParser.parseFromString(html, "text/html");
        const tr = dom.querySelector("tr");
        targetEl.appendChild(tr);
    },
    // 삭제 
    del(e) {
        const targetEl = document.getElementById("buttons_html");
        if (targetEl.children.length > 1) {
            targetEl.removeChild(targetEl.lastElementChild);
        }
    }
};


window.addEventListener("DOMContentLoaded", function() {
    const addEl = document.querySelector(".template_button_add");
    const delEl = document.querySelector(".template_button_del");

    if (addEl) { // 추가 
        addEl.addEventListener("click", tplForm.add);
    }

    if (delEl) { // 삭제
        delEl.addEventListener("click", tplForm.del);
    }
});