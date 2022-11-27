/** 
 * 관리자 회원 가입 관련 
 * 
 */
var codefty = codefty || {};
codefty.manager = {
    required : {
        managerId : "아이디를 입력하세요",
        managerNm : "관리자명을 입력하세요",
        managerPw : "비밀번호를 입력하세요",
        managerPwRe : "비밀번호를 확인하세요",
    },
    /**
     * 회원가입 유효성 검사
     * 
     * @param e 이벤트 객체 
     */
    submitJoin : function(e) {
        try {
            /** 회원정보 수정의 경우는 비밀번호 필수 항목 제외 */
            var isEdit = false;
            var passwordBox = document.querySelector(".password_box");
            if (passwordBox && passwordBox.classList.contains("dn")) {
                delete codefty.manager.required.managerPw;
                delete codefty.manager.required.managerPwRe;
                delete codefty.manager.required.managerId;
                isEdit = true;
            }

            /** 필수 항목 체크  */
            for (key in codefty.manager.required) {
                var el = document.getElementsByName(key)[0];
                if (el && el.value.trim() == "") {
                    el.focus();
                    throw new Error(codefty.manager.required[key]);
                }
            }

            /** 약관 동의 체크 S */
            var useTerms = document.getElementById("useTerms");
            if (useTerms && !useTerms.checked) {
                useTerms.focus();
                throw new Error("이용약관에 동의하세요.");
            }

            var privateTerms = document.getElementById("privateTerms");
            if (privateTerms && !privateTerms.checked) {
                privateTerms.focus();
                throw new Error("개인정보처리방침에 동의하세요.");
            }
            /** 약관 동의 체크 E */
        } catch (err) {
            e.preventDefault();
            alert(err.message);
        }
    },
};

window.addEventListener("DOMContentLoaded", function() {
    /** 약관 동의 전체 선택  */
    var termsCheckAll = document.querySelector("#frmJoin .terms #check_all");
    if (termsCheckAll) {
        termsCheckAll.addEventListener("click", function(e) {
            var checks = document.querySelectorAll("#frmJoin .check");
            for(var i = 0; i < checks.length; i++) {
                checks[i].checked = e.currentTarget.checked;
            }
        });
    } // endif 
    /** 회원 가입 양식 제출시 유효성 검사 S */
    var frmJoin = document.querySelector("#frmJoin");
    if (frmJoin) {
        frmJoin.addEventListener("submit", codefty.manager.submitJoin);
    }
    /** 회원 가입 양식 제출시 유효성 검사 E */

    /** 비밀번호 변경하기 S */
    var changePw = document.querySelector("#frmJoin #changePw");
    if (changePw) {
        changePw.addEventListener("click", function(e) {
            e.currentTarget.classList.add("dn");

            var list = document.querySelectorAll("#frmJoin .password_box");
            for (var i = 0; i < list.length; i++) {
                list[i].classList.remove("dn");
            }

        });
    }
    /** 비밀번호 변경하기 E */
});