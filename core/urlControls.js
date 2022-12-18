const urlControls = {
    /**
     * 접근 통제 하지 않는 URL 목록
     * 
     * @returns {Array}
     */
    anyOneAccessURL : function() {
        return [
            // 간편주문서
            '/simple',
            // 회원관련 
            '/manager/login',
            '/manager/join',
            '/manager/info',
            '/manager/edit',
            '/manager/logout',
            '/manager/share',
            '/mypage',            

            // 결제 관련
            '/payment',
            '/payment/notice',
            '/payment/process',
            '/payment/view',
            '/payment/terms',
            '/payment/callback',
            '/payment/mobile/callback',
    
            // 팝업 관련
            '/popup/sample',
            '/popup/delivery_guide',
            '/popup/customer/apply',
            '/popup/delivery_trace',
            '/calendar',

            // api 관련
            '/oauth',
            '/api/v1',

            // file 관련
            '/file/view_image',
            'file/ajax',
            '/file/delete',

            // 게시판 관련
            '/board/list',
            '/board/view',
            '/board/write',
            '/board/update',
            '/board/delete',
            '/board/password',
            '/board/reply',
            '/board/comment',

            // 사용자페이지 관련
            '/guide',

            // 운송장 조회 관련
            '/delivery',
        ];
    },
    /**
     * 역할별 추가 접속 가능 페이지 UL 
     * 
     */
    accessUrlByRoles : {
        designer : [
            '/popup/draft',
            '/customer',
        ],
    }
};

module.exports = urlControls;