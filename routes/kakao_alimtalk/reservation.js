const express = require('express');
const router = express.Router();
const { alert, logger, confirm } = require("../../library/common");
const reservationDao = require("../../models/kakaoAlimTalk/reservationDao");
const getAvailableTimes = require("../../service/kakaoAlimTalk/getAvailableTimes");
const saveReservation = require("../../service/kakaoAlimTalk/saveReservation");
const deleteReservation = require("../../service/kakaoAlimTalk/deleteReservation");
const cancelReserved = require('../../service/kakaoAlimTalk/cancelReserved');

/** 전송 예약 목록  */
router.route("/")
    .get(async (req, res) => {
        const search = req.query;
        const list = await reservationDao.getReserveds(search.page, search.limit, req, search);
        const pagination = reservationDao.pagination;
        const total = reservationDao.total;
        const data = { list, pagination, total };
        res.render("kakao_alimtalk/reservation/list", data);
    })
    .delete(async (req, res) => {
        try {
            await cancelReserved(req.body.id);
            alert("취소되었습니다.", res, "/kakao_alimtalk/reservation", "parent");
        } catch (err) {
            alert(err.message, res);
            logger(err);
        }
    });

/** 전송 예약 설정 */
router.route("/config")
    .get(async (req, res) => {

        const search = req.query;

        const list = await reservationDao.gets(search.page, search.limit, req, search);
        const pagination = reservationDao.pagination;
        const total = reservationDao.total;

        const data = { list, pagination, total, subMenuUrl : "/kakao_alimtalk/reservation" }; 

        res.render("kakao_alimtalk/reservation/config", data);
    })
    .delete( async (req, res) => {
        try {
            await deleteReservation(req.body.id);
            alert("삭제되었습니다.", res, "/kakao_alimtalk/reservation/config", "parent");
        } catch (err) {
            alert(err.message, res);
            logger(err);
        }
    });
/** 전송 예약 설정 등록 */
router.route("/add_config")
    .get((req, res) => {
        const availableTimes = getAvailableTimes(0, 0, 0, 0, 30);
        const data = {
            subMenuUrl : "/kakao_alimtalk/reservation",
            availableTimes,
            addScript : ["kakao_alimtalk/reservation_form"],
        };

        res.render("kakao_alimtalk/reservation/add", data);
    })
    .post(async (req, res) => { // 예약전송 설정 등록
        try {
            await saveReservation(req);
            confirm("설정이 등록되었습니다. 계속해서 등록하시겠습니까?", "parent.location.reload();", "parent.location.replace('/kakao_alimtalk/reservation/config');", res);
        } catch (err) {
            alert(err.message, res);
            logger(err);
        }
    });

/** 전송 예약 설정 수정 S */
router.get("/edit_config/:id", async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            throw new Error("잘못된 접근입니다.");
        }

        const data = await reservationDao.get(id);
        if (!data) {
            throw new Error("등록되지 않은 설정입니다.");
        }
        data.availableTimes = getAvailableTimes(0, 0, 0, 0, 30);
        data.subMenuUrl = "/kakao_alimtalk/reservation";
        data.addScript = ["kakao_alimtalk/reservation_form"];

        res.render("kakao_alimtalk/reservation/edit", data);

    } catch (err) {
        alert(err.message, res);
        logger(err);
    }
});

router.post("/edit_config", async (req, res) => {
    try {
        await saveReservation(req);
        alert("수정되었습니다.", res, "/kakao_alimtalk/reservation/config", "parent");
    } catch (err) {
        alert(err.message, res);
        logger(err);
    }
});
/** 전송 예약 설정 수정 E */
module.exports = router;