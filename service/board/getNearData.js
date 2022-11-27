const { getPrev, getNext } = require('../../models/board/boardDataDao');

/**
 * 이전 게시글, 다음 게시글 조회
 * 
 * @param {*} id 게시글 번호
 * @param {*} byCategory 카테고리 별
 */
module.exports = async (id, byCategory) => {
    
    const prev = await getPrev(id, byCategory);
    const next = await getNext(id, byCategory);
    
    return { prev, next };
};