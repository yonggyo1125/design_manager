window.addEventListener("DOMContentLoaded", function() {
    /** 선택하기 처리하기 S */
    const selectedMembersEl = document.getElementById("selected_members");

    selectedMembersEl.addEventListener("click", function() {
        try {
            const targetId = this.dataset.id;

            const idEls = document.querySelectorAll("input[name='id']:checked");
            if (idEls.length == 0) {
                throw new Error("관리자를 선택해 주세요.");
            }

            const list = [];
            for (const el of idEls) {
               const data = {
                    id : el.value,
                    managerId : el.dataset.managerId,
                    managerNm : el.dataset.managerNm,
               };
               list.push(data);
            }

            if (typeof parent.managerSelectCallback == 'function') {
               parent.managerSelectCallback(list, targetId);
            } 
        } catch (err) {
            alert(err.message);
        }
    });
    /** 선택하기 처리하기 E */
});