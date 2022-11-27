const { getException, logger, saveConfig, getConfig } = require('../../library/common');
const { Holiday, Sequelize : { Op } } = require('../index');
const HolidayUpdateException = getException("Holiday/HolidayUpdateException");
const calendar = require('../../library/calendar');

/**
 * 배송휴무일 관련 
 * 
 */
const holidayDao = {
    /**
     * 배송휴무일 달력 
     * 
     * @param {Int|string} year 
     * @param {int|string} month 
     */
    async getCalendar(year, month) {
		const data = calendar.get(year, month);
		const { days, stamps } = data;

		let schedules = await Holiday.findAll({
			attributes:  [ 'stamp', 'isHoliday', 'isCsHoliday', 'memo' ],
			where : {
				stamp : {
					[Op.in] : stamps,
				}
			},
			raw : true,
		});

		schedules = schedules.reduce((acc, v) => {
			acc[v['stamp']] = { isHoliday : v.isHoliday?true:false, isCsHoliday : v.isCsHoliday?true:false, memo : v.memo };
			return acc;
		}, {});
		
		days.forEach((v, i, _days) => {
			_days[i].schedules = schedules[v.stamp] || {};
		});
		data.days = days;

        return data;
    },
	
	/**
	 * 배송휴무일 설정 저장
	 * 
	 * @param {Object} req 
	 * @return {Boolean}
	 * @throws {HolidayUpdateException}
	 */
	async update(req) {
		if (!req || !req.body) {
			throw new HolidayUpdateException("잘못된 접근입니다.");
		}

		const data = req.body;
		if (data.stamp) {
			if (!(data.stamp instanceof Array)) {
				data.stamp = [data.stamp];
			}

			try {
				for await (stamp of data.stamp) {
					const cnt = await Holiday.count({ where : { stamp }});
					if (cnt > 0) { // 수정 
						await Holiday.update({
							isHoliday : data[`isHoliday_${stamp}`]?true:false,
							isCsHoliday : data[`isCsHoliday_${stamp}`]?true:false,
							memo : data[`memo_${stamp}`],
						}, { where : { stamp }});
					} else { // 추가
						await Holiday.create({
							stamp,
							isHoliday : data[`isHoliday_${stamp}`]?true:false,
							isCsHoliday : data[`isCsHoliday_${stamp}`]?true:false,
							memo : data[`memo_${stamp}`],
						});
					}
				}
			} catch (err) {
				logger(err);
				return false;
			}

		} // endif 
		let holidayYoils = {};
		if (data.holiday_yoils) {
			if (!(data.holiday_yoils instanceof Array)) {
				data.holiday_yoils = [data.holiday_yoils];
			}

			holidayYoils = data.holiday_yoils;
		}
		const upData = { holidayYoils };
		saveConfig("holiday", upData);

		let csHolidayYoils = {};
		if (data.csHoliday_yoils) {
			if (!(data.csHoliday_yoils instanceof Array)) {
				data.csHoliday_yoils = [data.csHoliday_yoils];
			}

			csHolidayYoils = data.csHoliday_yoils;
		} 
		saveConfig("csHoliday", { csHolidayYoils });
		return true;
	},
	/**
	 * 휴무일 체크 
	 * 
	 * @param {*} type 
	 * @param {*} date 
	 */
	async isHoliday(type, date) {
		type = type || 'cs';
    	if (!date) date = new Date();

    	const stamp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).getTime();
		const where = { stamp };
		let yoils = [];
		if (type == 'delivery') {
			where.isHoliday = true;
			yoils = await getConfig("holiday", "holidayYoils");
		} else {
			where.isCsHoliday = true;
			yoils = await getConfig("csHoliday", "csHolidayYoils");
		}

		const cnt = await Holiday.count({ where });

    	if (cnt > 0) {
			return true;
		}

		if (yoils.indexOf("" + date.getDay()) != -1) {
			return true;
		}

		
		return false;
	}
		

};

module.exports = holidayDao;