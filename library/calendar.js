const { getYoil } = require('./common');

/**
 * 달력 
 *
 */
const calendar = {
    /**
     * 달력 일수 
     * @param {Int|string} year 
     * @param {int|string} month 
     */
    get(year, month) {
        let date = new Date();
		year = year || date.getFullYear();
		month = month || date.getMonth() + 1;
		month = Number(month);

        /**
		1. 현재 달의 시작일, 현재 달의 마지막일(30, 31, 28, 29)
		2. 현재 달의 시작일의 요일
		*/
		date = new Date(year, month - 1, 1);
		const timeStamp = date.getTime();
		const dayStamp = 60 * 60 * 24 * 1000;
		
		const yoil = date.getDay(); // 0~6
		const startNo = yoil * -1;
		const endNo = 42 + startNo; // startNo 음수 아니면 0
		
		let nextMonthDays = 0;
		let days = [], stamps = []; // 날짜 
		for (let i = startNo; i < endNo; i++) {
			const newStamp = timeStamp + dayStamp * i;
			date = new Date(newStamp);
			
			const newYear = date.getFullYear();
			let newMonth = Number(date.getMonth() + 1);
			let newDay = date.getDate();
			if (newStamp > timeStamp && month != newMonth) { // 다음달 
				nextMonthDays++;
			}
			
			newMonth = (newMonth < 10)?"0"+newMonth:newMonth;
			newDay = (newDay < 10)?"0"+newDay:newDay;
			
			const str = `${newYear}.${newMonth}.${newDay}`;
			
			days.push({
				'date' : str, // 2020.07.20
				'day' : newDay, // 01, 02 
				'yoil' :  getYoil(newStamp), // 한글 요일 
				'stamp' : newStamp,
				'object' : date,
				'available' : true,
			});
			stamps.push(newStamp);
		} // endfor 

        if (nextMonthDays >= 7) {	
			days.length = stamps.length = 35;
		}

        let nextYear = year, prevYear = year;
		let nextMonth = month, prevMonth = month;
		if (month == 1) {
			prevYear--;
			prevMonth = 12;
			nextMonth++;
		} else if (month == 12) {
			nextYear++;
			nextMonth = 1;
			prevMonth--;
		} else {
			prevMonth--;
			nextMonth++;
		}

        return { days, year, month, prevYear, prevMonth, nextYear, nextMonth, stamps };
    }
};

module.exports = calendar;