const crypto = require('crypto');
const { getConfig } = require('../../library/common');


/**
 * 이니시스 관련 
 * 
 */
const inicisLib = {
    /**
     * 이니시스 설정 조회
     * 
     */
     async getConfig(orderNo, amount) {
        if (this.config) {
            return this.config;
        }

        const config = await getConfig("payConfig");
        if (!config) {
            return false;
        }
        
        if (config.type != 'real') {
            config.mid = "INIpayTest";
            config.signkey = "SU5JTElURV9UUklQTEVERVNfS0VZU1RS";
            config.iniApiKey = "ItEQKi3rY7uvDS8l";
            config.iniApiIv = "HYb3yQ4f65QL89==";
        }

        if (orderNo && amount) {
            config.mKey = crypto.createHash("SHA256").update(config.signkey).digest("hex");
            config.timestamp = Date.now();
            const qs = `oid=${orderNo}&price=${amount}&timestamp=${config.timestamp}`;
            config.signature = crypto.createHash("SHA256").update(qs).digest("hex");
        }

        return config;
    },
    /**
     * 발급사(은행) 코드
     * 
     * @param {String} code 은행코드 
     * @returns {String} 은행명
     */
    getBank(code) {
        if (!code)  {
            return "";
        }

        const banks = {
            '11' : '농협중앙회',
            '12' : '단위농협',
            '16' : '축협중앙회',
            '20' : '우리은행',
            '21' : '구)조흥은행',
            '22' : '상업은행',
            '23' : 'SC제일은행',
            '24' : '한일은행',
            '25' : '서울은행',
            '26' : '구)신한은행',
            '27' : '한국씨티은행 (구 한미)',
            '31' : '대구은행',
            '32' : '부산은행',
            '34' : '광주은행',
            '35' : '제주은행',
            '37' : '전북은행',
            '38' : '강원은행',
            '39' : '경남은행',
            '41' : '비씨카드',
            '45' : '새마을금고',
            '48' : '신용협동조합중앙회',
            '50' : '상호저축은행',
            '53' : '한국씨티은행', 
            '54' : '홍콩상하이은행',
            '55' : '도이치은행',
            '56' : 'ABN암로',
            '57' : 'JP모건',
            '59' : '미쓰비시도쿄은행',
            '60' : 'BOA(Bank of America)',
            '64' : '산림조합',
            '70' : '신안상호저축은행',
            '71' : '우체국',
            '81' : '하나은행',
            '83' : '평화은행',
            '87' : '신세계',
            '88' : '신한(통합)은행',
            '89' : '케이뱅크',
            '90' : '카카오뱅크',
            '91' : '네이버포인트(포인트 100% 사용)',
            '92' : '토스뱅크',
            '93' : '토스머니(포인트100% 사용)',
            '94' : 'SSG머니(포인트 100% 사용)',
            '96' : '엘포인트(포인트 100% 사용)',
            '97' : '카카오 머니',
            '98' : '페이코 (포인트 100% 사용)',
            '02' : '한국산업은행',
            '03' : '기업은행',
            '04' : '국민은행',
            '05' : '하나은행 (구 외환)',
            '06' : '국민은행 (구 주택)',
            '07' : '수협중앙회',
            'D1' : '유안타증권(구 동양증권)',
            'D2' : '현대증권',
            'D3' : '미래에셋증권',
            'D4' : '한국투자증권',
            'D5' : '우리투자증권',
            'D6' : '하이투자증권',
            'D7' : 'HMC투자증권',
            'D8' : 'SK증권',
            'D9' : '대신증권',
            'DA' : '하나대투증권',
            'DB' : '굿모닝신한증권',
            'DC' : '동부증권',
            'DD' : '유진투자증권',
            'DE' : '메리츠증권',
            'DF' : '신영증권',
            'DG' : '대우증권',
            'DH' : '삼성증권',
            'DI' : '교보증권',
            'DJ' : '키움증권',
            'DK' : '이트레이드',
            'DL' : '솔로몬증권',
            'DM' : '한화증권',
            'DN' : 'NH증권',
            'DO' : '부국증권',
            'DP' : 'LIG증권',
            'BW' : '뱅크월렛',
        };
        if (code == 'all') {
            return banks;
        }
        
        return  banks[code] || "";
    },
    /**
     * 카드코드
     * 
    * @param {String} code 카드코드 
     * @returns {String} 카드사
     */
    getCard(code) {
        if (!code)  {
            return "";
        }

        const cards = {
            '11' : '비씨카드',
            '12' : '삼성카드',
            '14' : '신한카드(구.LG카드 포함)',
            '21' : '글로벌 VISA',
            '22' : '글로벌 MASTER',
            '23' : '글로벌 JCB',
            '24' : '글로벌 아멕스',
            '25' : '글로벌 다이너스',
            '26' : '중국은련카드',
            '32' : '광주카드',
            '33' : '전북카드',
            '34' : '하나카드',
            '35' : '산업카드',
            '38' : '우리카드',
            '41' : 'NH카드',
            '43' : '씨티카드',
            '48' : '신협체크카드',
            '51' : '수협카드',
            '52' : '제주카드',
            '54' : 'MG새마을금고체크',
            '55' : '케이뱅크카드',
            '56' : '카카오뱅크',
            '71' : '우체국체크',
            '95' : '저축은행체크',
            '01' : '외환카드',
            '03' : '롯데카드',
            '04' : '현대카드',
            '06' : '국민카드',
        };

        return cards[code] || "";
    }
};

module.exports = inicisLib;