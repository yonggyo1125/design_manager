/**
 * 유투브 영상 자동 생성 
 * 
 * @author 코드팩토리
 */
var codefty = codefty || {};
codefty.youtube = {
    /** youtube 영상을 로딩할 위치 (id로 지정) */
    target : null,
    setTarget : function(target) {
        this.target = target;
        return this;
    },
    /**
     * URL에서 youtubeID 추출 
     * 
     * https://www.youtube.com/watch?v=VbzOs5NY0i0
     * YOUTUBE URL의 쿼리스트링값 중에 v 매개변수가 youtubeID
     * 
     * @param {String} url 
     * @return {String} url에서 추출한 youtubeID
     */
    getYoutubeId : function(url) {
        if (url.indexOf("v=") == -1)
            return;

        var qs = url.substring(url.lastIndexOf("?")+1)
                    .split("&")
                    .map(function(v) {
                        return v.split("=")
                    })
                    .reduce(function(acc, v) {
                      acc[v[0]] = v[1];
                      return acc;
                    }, {});
        
        return qs.v;

    },
    /**
     * 유투브 영상 로드  
     *  
     * @param {String} youtubeId 유투브 ID  
     * @param {int} width  영상 너비 
     * @param {int} height  영상 높이
     * @param {boolean} autoplay 자동 재생 여부 
     * @param {boolean} controls 동영상 플레이 콘트롤 표기 여부 
     */
    load : function(youtubeId, width, height, autoplay, controls) {
        if (!this.target || !youtubeId) { // 출력할 요소 id가 없거나 유투브 ID가 입력되지 않은 경우는 실행 중단
            return;
        }

        width = width || 560;
        height = height || 315;
        var src = "https://www.youtube.com/embed/" + youtubeId; 

        var addQs = [];
        if (autoplay) addQs.push("autoplay=1");
        if (controls) addQs.push("controls=1");
        if (addQs.length > 0) src += "?" + addQs.join("&");

        var iframe = document.createElement("iframe");
        var videoId = "youtube_player_" + this.target;

        /** 기존 영상이 이미 있는 경우는 제거 */
        var prevVideo = document.getElementById(videoId);
        if (prevVideo) {
            prevVideo.parentElement.removeChild(prevVideo);
        }

        iframe.width = width;
        iframe.height = height;
        iframe.id = videoId;
        iframe.src = src;
        iframe.setAttribute('frameborder', 0);
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        iframe.setAttribute('allowfullscreen', true);
        
        var target = document.getElementById(this.target);
        if (target) {
            target.appendChild(iframe);
        }
    },
    /**
     * 유투브 영상 제거
     * 
     * @param {String} id 
     */
    close : function(id) {
        this.target = this.target || id;
        var videoFrm = document.querySelector("#" + this.target + " iframe");
        if (videoFrm) {
            videoFrm.parentElement.removeChild(videoFrm);
        }
    }
};
