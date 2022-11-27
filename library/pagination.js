/**
 * 페이징 처리 
 * 
 * @date 2021-12-15
 * @author 코드팩토리
 */
class Pagination {
    /**
     * 생성자
     * 
     * @param {Object} req 
     * @param {int} page 페이지 번호, 기본값 1 
     * @param {int} total 전체 페이지 갯수
     * @param {int} pageLinks 구간 페이지 갯수 (기본값 10)
     * @param {int} limit 1페이지당 레코드 갯수 
     * @param {String} url 페이징 URL
     */
    constructor(req, page, total, pageLinks, limit, url) {
        this.page = page || 1;
        this.limit = limit || 20;
        this.total = total;
        this.pageLinks = pageLinks || 10; 
        this.lastPage = Math.ceil(this.total / this.limit);
        this.prevNo = 0;
        this.nextNo = 0;
        this.url = url;

        if (!this.total)
            return;
            
        /**
         * 현재 page가 마지막 페이지보다 크다면 
         * 마지막 페이지 -1로 교체 
         */
        if (this.page > this.lastPage) {
            this.page = this.lastPage;
        }

        this.num = Math.floor((this.page - 1) / this.pageLinks); // 페이지 생성 기준번호
        this.startNo = this.pageLinks * this.num + 1; // 현재 page 기준의 시작 번호
        this.lastNo = this.startNo + this.pageLinks - 1; // 현재 page 기준의 마지막 번호

        // 현재 page 기준 마지막 번호가 마지막 번호보다 크다면
        if (this.lastNo > this.lastPage) {
            this.lastNo = this.lastPage;
        }

        /**
         * 이전페이지 시작 번호
         * 
         * 첫 페이지 구간이 아닌 경우는 이전 페이지 번호 생성 
         */
        if (this.num > 0) {
            this.prevNo = this.pageLinks * (this.num - 1) + 1;
        }

        /**
         * 다음 페이지 시작 번호
         * 
         * 마지막 페이지 구간이 아니라면 다음 페이지 번호 생성
         */
        this.lastNum = Math.floor((this.lastPage - 1) / this.pageLinks);
        if (this.num < this.lastNum) {
            this.nextNo = this.pageLinks * (this.num + 1) + 1;
        }
        /** 페이징 URL 처리 S */
        if (this.url) {
            if (this.url.indexOf("?") == -1) {
                this.url += "?";
            } else {
                this.url += "&";
            }
        } else {
            const qs = [];
            if (req.query) {
                for(let key in req.query) {
                    if (key == 'page') continue;
                    qs.push(`${key}=${req.query[key]}`);
                }
            }
            
            if (qs.length > 0) {
                this.url = "?" + qs.join("&") + "&";
            } else {
                this.url = "?";
            }    
        }
        /** 페이징 URL 처리 E */
    }

    /**
     * 페이징 HTML 생성
     * 
     */
    getPages() {
        if (!this.total)
            return;

        let html = "<ul class='pagination'>";
        
        if (this.num > 0) {
            // 처음페이지 
            html += `<li class='page first'><a href='${this.url}page=1' data-page='1'>처음</a></li>`;

            // 이전페이지
            html += `<li class='page prev'><a href='${this.url}page=${this.prevNo}' data-page='${this.prevNo}'>이전</a>`;
        }

        for (let i = this.startNo; i <= this.lastNo; i++) {
            const url = this.url + `page=${i}`;
            const addClass = (i == this.page)?" on":"";
            html += `<li class='page${addClass}'><a href='${url}' data-page='${i}'>${i}</a></li>`;    
        }

        // 다음페이지
        if (this.nextNo > 0) {
            const url = this.url + `page=${this.nextNo}`;
            html += `<li class='page next'><a href='${url}' data-page='${this.nextNo}'>다음</a></li>`;
        }

        // 마지막 페이지
        if (this.page < this.lastPage) {
            html += `<li class='page last'><a href='${this.url}page=${this.lastPage}' data-page='${this.lastPage}'>마지막</a></li>`
        }

        html += "</ul>";

        return html;
    }
}

module.exports = Pagination;