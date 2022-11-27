/**
 * 예약설정 양식
 * 
 */
const reservationForm = {
    /**
     * 설정 추가
     * 
     * @param {*} e 
     */
    add(e) {
        try {
            const targetEl = document.getElementById("reservation_times");
            let html = document.getElementById("tpl").innerHTML;
            const stimeEl = document.getElementById("stime");
            const etimeEl = document.getElementById("etime");
            if (!targetEl || !html || html.trim() == "" || !stimeEl || !etimeEl) {
                throw new Error("잘못된 접근입니다.");
            } 

            const sstamp = parseInt(stimeEl.value);
            const estamp = parseInt(etimeEl.value);

            if (estamp <= sstamp) {
                throw new Error("종료시간은 시작시간보다 작거나 같을수 없습니다.");
            }
            
            const id = `time_${sstamp}_${estamp}`;
            const sameEl = document.getElementById(id);
            if (sameEl) {
                throw new Error("이미 등록된 시간대 입니다.");
            }

            const sOptionEls = stimeEl.getElementsByTagName("option");
            const eOptionEls = etimeEl.getElementsByTagName("option");
            let sStr = "", eStr = "";
            for (const el of sOptionEls) {
                if (el.selected) {
                    sStr = el.innerText;
                    break;
                }
            }

            for (const el of eOptionEls) {
                if (el.selected) {
                    eStr = el.innerText;
                    break;
                }
            }

            html = html.replace(/<%=stime%>/g, sstamp)
                        .replace(/<%=etime%>/g, estamp)
                        .replace(/<%=sStr%>/g, sStr)
                        .replace(/<%=eStr%>/g, eStr);

            const domParser = new DOMParser();
            const dom = domParser.parseFromString(html, "text/html");
            const liEl = dom.querySelector("li");
            targetEl.appendChild(liEl);
            
            const removeEl = liEl.querySelector(".remove");
            removeEl.addEventListener("click", reservationForm.delete);
        } catch (err) {
            alert(err.message);
        }
    },
    /**
     * 설정 삭제 
     * @param {*} e 
     */
    delete(e) {
        if (!confirm("정말 삭제하시겠습니까?")) {
            return;
        }

        const el = e.currentTarget;
        const parentEl = el.parentElement;
        parentEl.parentElement.removeChild(parentEl);
    }
};

window.addEventListener("DOMContentLoaded", function() {
    const addConfigEl = document.getElementById("add_config");
    if (addConfigEl) {
        addConfigEl.addEventListener("click", reservationForm.add);
    }

    const removeEls = document.querySelectorAll("#reservation_times .remove");
    for (const el of removeEls) {
        el.addEventListener("click", reservationForm.delete);
    }
});