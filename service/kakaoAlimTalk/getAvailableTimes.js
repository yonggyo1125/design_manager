const e = require("express");

/**
 * 전송가능시간대 추출
 * 
 * @param {*} shour 
 * @param {*} smin 
 * @param {*} ehour 
 * @param {*} emin 
 * @param {*} interval 
 */
module.exports = (shour, smin, ehour, emin, interval) => {
    shour = shour || 0;
    smin = smin || 0;
    ehour = ehour | 0;
    emin = emin || 0;

    interval = interval || 60;

    const date = new Date();   
    const sdate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), shour, smin, 0);
    let edate;
    if (!ehour) {
        edate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
        edate.setDate(edate.getDate() + 1);
        edate.setSeconds(edate.getSeconds() - 1);
    } else {
        edate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), ehour, emin, 0);
    }
    const list = [];
    const sTimestamp = sdate.getTime();
    const eTimestamp = edate.getTime();
    const intervalStamp = interval * 60 * 1000;
    for (let i = sTimestamp; i <= eTimestamp; i+= intervalStamp) {
        const date = new Date(i);
        let hour = date.getHours();
        let min = date.getMinutes();
        
        hour = hour < 10 ? `0${hour}`:hour;
        min = min < 10 ? `0${min}`:min;
        
        list.push({
            stamp : i,
            hour : date.getHours(),
            min : date.getMinutes(),
            str : `${hour}:${min}`,  
        })
        
    }
    
    return list;
};