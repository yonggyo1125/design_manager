const pagination = {
  createPaging(page, total, pageLinks, limit) {
    if (!total) {
      return;
    }

    const params = new URLSearchParams(location.search);
    page = page || params.get("page") || 1;
    page = Number(page);

    pageLinks = pageLinks || 5;
    limit = limit || 10;
    const lastPage = Math.ceil(total / limit);
    const lastRangeNum = Math.floor((lastPage - 1) / pageLinks);

    if (page > lastPage) page = lastPage;
    if (page < 1) page = 1;

    const rangeNum = Math.floor((page - 1) / pageLinks);
    let startNo = rangeNum * pageLinks + 1;
    let endNo = startNo + pageLinks - 1;
    if (endNo > lastPage) endNo = lastPage; // 구간별 마지막 페이지는 실 마지막 페이지보다는 작거나 같아야

    // 현재 구간이 첫 구간이 아니면 이전 구간 첫 페이지번호
    let prevNo = 0,
      nextNo = 0;
    if (rangeNum > 0) {
      prevNo = (rangeNum - 1) * pageLinks + 1;
    }

    // 현재 페이지 구간이 마지막 구간이 아닐때
    if (rangeNum < lastRangeNum) {
      nextNo = (rangeNum + 1) * pageLinks + 1;
    }

    return { page, lastPage, total, startNo, endNo, prevNo, nextNo };
  },
};

const result = {
  total: 2231,
  page: 15,
  pageLinks: 10,
  limit: 10,
  rows: [
    { no: 1, subject: "제목1", contents: "내용" },
    { no: 2, subject: "제목1", contents: "내용" },
    { no: 2, subject: "제목1", contents: "내용" },
  ],
};

const data = pagination.createPaging(
  result.page,
  result.total,
  result.pageLinks,
  result.limit
);
console.log(data);
let html = `<li class='page first' data-page-no=1>First</li>`;
if (data.prevNo > 0) {
  html += `<li class='page prev' data-page-no=${data.prevNo}>Prev</li>`;
}
for (let i = data.startNo; i <= data.endNo; i++) {
  html += `<li class='page' data-page-no=${i}>${i}</li>`;
}
if (data.nextNo > 0) {
  html += `<li class='page next' data-page-no=${data.nextNo}>Next</li>`;
}

html += `<li class='page last' data-page-no=${data.lastPage}>Last</li>`;
const paginationEl = document.querySelector(".pagination");
paginationEl.innerHTML = html;

const liEls = document.querySelectorAll(".pagination .page");
for (const el of liEls) {
  el.addEventListener("click", function () {
    const page = el.dataset.pageNo;
    console.log(page);
  });
}
