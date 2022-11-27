
/** 
 * 관리자 선택 콜백 처리 
 * 
 */
 function managerSelectCallback(list, targetId) {
    if (!targetId) {
        return;
    }

    const targetEl = document.getElementById(targetId);
    const tplEl = document.getElementById("tplMembers");
    if (!targetEl || !tplEl) {
        return;
    }

    const tpl = tplEl.innerHTML;
    const domParser = new DOMParser();
    if (list && list.length > 0) {
        for (const li of list) {
            const uid = `${targetId}_${li.id}`;
            const el = document.getElementById("members_" + uid);
            // 이미 선택된 회원이 있는 경우 건너뛰기 
            if (el) {
                continue;
            }
            let html = tpl;
            html = html.replace(/<%=uid%>/g, uid)
                .replace(/<%=id%>/g, li.id)
                .replace(/<%=target%>/g, targetId)
                .replace(/<%=managerNm%>/g, li.managerNm)
                .replace(/<%=managerId%>/g, li.managerId);

            const dom = domParser.parseFromString(html, "text/html");
            const liEl = dom.querySelector("li");
            if (liEl) {
                targetEl.appendChild(liEl);

                const removeEl = liEl.querySelector(".remove");
                if (removeEl) {
                    removeEl.addEventListener("click", function() {
                        if (!confirm('정말 삭제하시겠습니까?')) {
                            return;
                        }

                        const parentEl = this.parentElement;
                        parentEl.parentElement.removeChild(parentEl);
                    });
                }
            }
        }
    } // endif 

    codefty.popup.close();
}
