const crypto = require('crypto');
const winston = require('winston');
const fs = require('fs').promises;
const constants = require('fs').constants;
const path = require('path');
const { Config } = require('../models');

/**
* 공통 라이브러리 
*
*/
const commonLib = {
	/**
	* 암호화 알고리즘, key, iv 설정
	*/
	cryptoAlgo : process.env.cryptoAlgo || "aes-256-cbc",
	cryptoKey : process.env.cryptoKey || "abcdefghijklmnopqrstuvwxyz123456",
	cryptoIv : process.env.cryptoIv || "1234567890123456",

	/**
	* window.alert 메세지 출력 
	*
	* @param {String} msg 출력 메세지
	* @param {Object} res - response 인스턴스
	* @param {int|String} step - 숫자 - history.go(step) -> 음수 이면 이전페이지(back), 양수 다음페이지(forward)
	*			  - 문자 - location.replace() -> 문자이면 페이지 이동 
	*
	*/
	alert(msg, res, step, target) {
		target = target || "self";
		let script = `<script>alert("${msg}");</script>`;
		if (step) {
			if (typeof step == 'string') {
				if (step == 'reload') {
					script += `<script>${target}.location.reload();</script>`;
				} else if (step == 'close') {
					script += `<script>${target}.close();</script>`;
				} else {
					script += `<script>${target}.location.replace('${step}');</script>`;
				}
			} else {
				script += `<script>${target}.history.go(${step});</script>`;
			}
		}
		
		res.send(script);
	},
	/**
	* location.href를 사용하는 페이지 이동 
	* 
	* @param {String} url 이동할 URL 
	* @param {Object} res - response 인스턴스
	* @param {String} target - self(기본값) | parent -> 부모창 
	*/
	go(url, res, target) {
		target = target || "self";
		
		const script = `<script>${target}.location.replace('${url}');</script>`;
		res.send(script);
	},
	/**
	* 새로고침 
	*
	* @param {Object} res - response 인스턴스
	* @param {String} target - 기본값 self - 현재 창,  parent - 부모창 
	*/
	reload(res, target) {
		target = target || 'self';
		
		const script = `<script>${target}.location.reload();</script>`;
		res.send(script);
	},
	/**
	 * 확인 메세지 팝업 
	 * 
	 * @param {String} message 확인메세지 
	 * @param {String} success 확인 버튼 클릭시 실행될 함수
	 * @param {String} cancel 취소 버튼 클릭시 실행될 함수 
	 * @param {Object} res
	 */
	confirm(message, success, cancel, res) {
		const script = `
			<script>
				if (confirm('${message}')) {
					${success}
				} else {
					${cancel}
				}
			</script>
		`;

		res.send(script);
	},
	/**
	 * 레이어 팝업 닫기
	 * 
	 * @param {Object} res 
	 * @param {String} target  - 기본값 self,
	 */
	layerClose(res, target) {
		target = target || 'self';

		const script = `
		<script>
			${target}.codefty.popup.close();
		</script>
		`;

		res.send(script);
	},
	/**
	* Unique ID  - 밀리초 단위 timestamp 
	* new Date().getTime();
	* Date.now();
	*/
	uid() {
		return Date.now();
	},
	 /**
	 * 요일 목록 
	 * 
	 */
	  getYoils() {
		return ["일", "월", "화", "수", "목", "금", "토"];
	},
    /**
     * 요일 
     * 
     * @param {Long|date} date
     * @return {String}
     */
    getYoil(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }

        const yoil = date.getDay();
        
        return commonLib.getYoils()[yoil];
    },
	/**
	* 날짜 형식 변환 
	*
	* @param {String} format 
			-> %Y -> 연도, %m ->월 %d -> 일 
			-> %H -> 시, %i -> 분, %s -> 초 
	*/
	dateFormat(dateStr, format) {
		if (!format) {
			return dateStr;
		}
		
		let date;
		if (dateStr instanceof Date) {
			date = dateStr;
		} else {
			date = new Date(dateStr);
		}

		const year = date.getFullYear();
		let month = date.getMonth() + 1; 
		month = (month < 10)?"0"+month:month;
		let day = date.getDate();
		day = (day < 10)?"0"+day:day;
		
		let hour = date.getHours();
		hour = (hour < 10)?"0"+hour:hour;
		let min = date.getMinutes();
		min = (min < 10)?"0"+min:min;
		let sec = date.getSeconds();
		sec = (sec < 10)?"0"+sec:min;
		
		format = format.replace(/%Y/g, year)
							 .replace(/%m/g, month)
							 .replace(/%d/g, day)
							 .replace(/%H/g, hour)
							 .replace(/%i/g, min)
							 .replace(/%s/g, sec);
		
		return format;
		
	},
	/**
	 * 한국 시간대에 맞는 시간으로 변환 
	 * 
	 * @param {String|Date} orgDate
	 * @param {String} format 표기 양식
	 */
	getLocalDate(orgDate, format) {
		const timezoneOffset = new Date().getTimezoneOffset() / 60;
		let date;		
		if (orgDate instanceof Date) {
			date = orgDate;
		} else {
			let tmp = new Date(orgDate);
			date = new Date(Date.UTC(tmp.getYear(), tmp.getMonth(), tmp.getDate(), tmp.getHours(), tmp.getMinutes(), tmp.getSeconds()));
		}

		const timeStamp = date.getTime() + (timezoneOffset * 60 * 1000);
		let newDate = new Date(timeStamp);
		if (format) {
			return newDate = commonLib.dateFormat(newDate.toString(), format);
		} else {
			return newDate;
		}
	},
	/**
	 * 오늘날짜 timeStamp 
	 * 
	 */
	getToday() {
		const date = new Date();

		return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).getTime();
	},
	/**
	 * UTC 기준 Date 인스턴스로 변경
	 * 
	 * @param {Date|String} orgDate 
	 * @returns {Date}
	 */
	getUTCDate(orgDate) {
		let date;
		if (orgDate instanceof Date) {
			date = new Date(orgDate.getYear(), orgDate.getMonth(), orgDate.getDate(), orgDate.getHours(), orgDate.getMinutes(), orgDate.getSeconds());

		} else {
			let tmp = new Date(orgDate);
			let year = tmp.getYear();
			if (("" + year).length == 3) {
				year = "20" + ("" + year).substring(1);
			}
			date = new Date(year, tmp.getMonth(), tmp.getDate(), tmp.getHours(), tmp.getMinutes(), tmp.getSeconds());
		}
		let stamp = date.getTime();
		const offsetHours = date.getTimezoneOffset() / 60;
		stamp += 1000 * 60 * 60 * offsetHours;

		return new Date(stamp)
	},
	/**
	* 브라우저 ID 
	*   1. 비회원 -> IP + User-Agent 
	*   2. 회원 -> 회원번호
	*/
	getBrowserId(req) {
		let data = "";
		if (req.isLogin) { // 회원인 경우 
			data = "" + req.manager.memNo;
		} else { // 비회원 
			const ip = req.ip; // 클라이언트 IP 
			const ua = req.headers['user-agent']; // 브라우저 정보
			data = ip + ua;
		}
		
		const browserId = crypto.createHash("md5").update(data).digest("hex");
		
		return browserId;
	},
	/**
	 * 로그 기록
	 * @param {String|Error} message 에러메세지, Error객체 
	 * @param {String} level 로깅 레벨
	 * @returns 
	 */
	async logger(message, level) {
		level = level || 'info';
        
        if (!message) 
            return;

        let logDir = path.join(__dirname, "../logs");
        try {
            await fs.access(logDir, constants.F_OK);
        } catch (err) {
            if (err.code == 'ENOENT') {
                // 로그 디렉토리가 없다면 생성 
                await fs.mkdir(logDir);
            }
        }
        
        const today = commonLib.dateFormat(new Date(), "%Y%m%d");
        logDir += `/${today}`;
        try {
            await fs.access(logDir, constants.F_OK);
        } catch (err) {
            if (err.code == 'ENOENT') {
                // 오늘 날짜 디렉토리가 없다면 생성 
				try {
                	await fs.mkdir(logDir);
				} catch (e) {
					return;
				}
            }
        }
        const logger = winston.createLogger({
            level: 'info',
            format: winston.format.json(),
            defaultMeta: { service: 'general' },
            transports: [
              new winston.transports.File({ filename: `${logDir}/error.log`, level: 'error'}),
              new winston.transports.File({ filename: `${logDir}/combined.log`}),
            ],
        });

       
        /** 실제 서비스가 아닌 경우는 콘솔에 로그 표기 */
        if (process.env.NODE_ENV !== 'production') { 
            logger.add(new winston.transports.Console({
              format: winston.format.simple(),
            }));
        }

        if (message instanceof Error) { // 에러 객체가 넘어온 경우 
			message.message = `[${message.constructor.name}] ${message.message}`;
            message.message = message.status?`[statusCode : ${message.status}] ${message.message}`:message.message;
            logger.log({ level : "error", message : message.message});
            logger.log({ level : "error", message : message.stack});
        } else {       
            logger.log({level, message});
        }
	},
	/**
	 * 데이터 암호화
	 * 
	 * @param {String} data 암호화할 문자열
	 */
	secureSet(data) {
		if (!data || typeof data != 'string')
			return;

		const cipher = crypto.createCipheriv(commonLib.cryptoAlgo, commonLib.cryptoKey, commonLib.cryptoIv);
		
		let result = cipher.update(data, "utf8", "base64");
		result += cipher.final("base64");

		return result;
	},
	/**
	 * 데이터 복호화
	 * 
	 * @param {String} data 복호화할 문자열
	 */
	secureGet(data) {
		if (!data || typeof data != 'string')
			return;

		const decipher = crypto.createDecipheriv(commonLib.cryptoAlgo, commonLib.cryptoKey, commonLib.cryptoIv);
		let result = decipher.update(data, "base64", "utf8");
		result += decipher.final("utf8");
		return result;
	},
	/**
	 * md5 해시 생성 
	 * 
	 * @return
	 */
	md5(data) {
		return crypto.createHash("md5").update(data).digest("hex");
	},
	/**
	 * 예외 가져오기
	 * 
	 */
	getException(exceptionPath) {
		if (exceptionPath) {
			const _path = path.join(__dirname, "../core/Exception/", exceptionPath);
			return require(_path);
		}
	},
	/**
	 * 설정 JSON 조회 
	 *  
	 * @param {String} 설정 json 이름
	 * @param {String} 설정 속성명 
	 */
	async getConfig(configNm, key) {
		try {
			const config = await Config.findByPk(configNm, { raw : true });
			if (!config) {
				return false;
			}

			let data = config.value || {};
			if (typeof data == 'string') {
				data = JSON.parse(data);
			}
			
			if (data.companyStampFileId) {
				const fileDao = require('../models/file/dao');
				data.companyStamp =  await fileDao.get(data.companyStampFileId);
			}

			return key?data[key]:data;
			
		} catch (err) {
			commonLib.logger(err);
			return false;
		}
	},
	/**
	 * 설정 수정하기 
	 * 
	 * @param {String} configNm 
	 * @param {Object} data 
	 */
	async saveConfig(configNm, data) {
		try {
			const cnt = await Config.count({ where : { key : configNm }});
			data = data || {};
			const value = data;
			if (cnt > 0) { // 수정 
				await Config.update({
					value,
				}, { where : { key : configNm }});
			} else { // 추가 
				await Config.create({
					key : configNm,
					value,
				});
			}

			return true;
		} catch (err) {
			commonLib.logger(err);
			return false;
		}
	},
	/**
	 * 휴대전화번호 유효성 검사
	 * 
	 * @param {String} cellPhone 휴대전화번호
	 * @return {Boolean}
	 */
	validateCellPhone(cellPhone) {
		cellPhone = cellPhone.replace(/[^\d]/g, "");
    	const pattern = /^01[016789][\d]{3,4}[\d]{4}$/;

    	return pattern.test(cellPhone);
	},
	/**
	 * 전화번호 유효성 검사
	 * 
	 * @param {String} phone 유선전화번호
	 * @return {Boolean}
	 */
	 validatePhone(phone) {
		cellPhone = phone.replace(/[^\d]/g, "");
    	const pattern = /^[\d]{0,3}[\d]{3,4}[\d]{4}$/;

    	return pattern.test(phone);
	},
	/**
     * postMessage 전송하기
     * 
	 * @param {String} msg 출력할 메세지
     * @param {Mixed} data 전송할 데이터
     * @param {Object} res 
     */
	sendPostMessage(msg, data, res, _target) {
		data = JSON.stringify(data);
		_target = _target?`${_target}.`:"";
		let script = "";
		if (msg) script += `<script>alert('${msg}');</script>`;
		script += `
		<script>
			let target;
			if (${_target}parent) {
				target = ${_target}parent;
			}

			if (${_target}opener) {
				target = ${_target}opener;
			}
			target.postMessage(${data}, "*");
		</script>
		`;
		
		res.send(script);
    },
	/**
	 * \r\n문자를 br태그로 변환
	 * 
	 * @param {String} str 
	 */
	nl2br(str) {
		if (str) {
			return str.replace(/\n/g, "<br>").replace(/\r/g, "");
		}
	},
	/** 모바일 여부 체크  */
	isMobile(req) {
		const ua = req.header("user-agent");
		const result = /mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile|ipad|android|android 3.0|xoom|sch-i800|playbook|tablet|kindle/i.test(ua);

		return result;
	}
};

module.exports = commonLib;