const commonLib = require('../library/common');

/**
 * 로거
 * 
 */
module.exports = (req, res, next) => {
    req.logger = res.logger = commonLib.logger;
    next();
};
