const { getException } = require('../../library/common');
const managerDao = require('../../models/manager/dao');
const ManagerControlsUpdateException = getException("Manager/ManagerControlsUpdateException");

/**
 * 탈퇴 , 이용제한 관리 
 * 
 */
const controlService = {
    /**
     * 탈퇴, 이용제한 처리하기
     * 
     * @param {Object} req
     * @throws {ManagerControlsUpdateException}
     */
    async update(req) {
        const data = req.body;
        const id = req.params.id;
        if (!data || !id) {
            throw new ManagerControlsUpdateException("잘못된 접근입니다.");
        }

        data.id = id;

        const result = await managerDao.updateControls(data);
        if (!result) {
            throw new ManagerControlsUpdateException();
        }
    }
};

module.exports = controlService;