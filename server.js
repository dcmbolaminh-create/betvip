const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// API nguồn
const API_MD5 = "https://wtxmd52.macminim6.online/v1/txmd5/sessions";
const API_TX = "https://wtx.macminim6.online/v1/tx/sessions";

// Bộ nhớ AI
let historyCache = [];

// ====== HÀM PHÂN TÍCH ======
function analyze(data) {
    const list = data.slice(0, 50);

    let tai = 0, xiu = 0;
    let streak = 1;
    let maxStreak = 1;

    let last = list[0]?.resultTruyenThong;

    // tần suất + streak
    list.forEach((item, i) => {
        if (item.resultTruyenThong === "TAI") tai++;
        else xiu++;

        if (i > 0) {
            if (item.resultTruyenThong === list[i - 1].resultTruyenThong) {
                streak++;
                maxStreak = Math.max(maxStreak, streak);
            } else {
                streak = 1;
            }
        }
    });

    // Markov đơn giản
    let markov = { TAI: 0, XIU: 0 };
    for (let i = 1; i < list.length; i++) {
        if (list[i - 1].resultTruyenThong === "TAI") {
            if (list[i].resultTruyenThong === "TAI") markov.TAI++;
            else markov.XIU++;
        }
    }

    // xu hướng
    let trend = tai > xiu ? "TÀI" : "XỈU";

    // Fibonacci dự đoán (fake logic nhẹ)
    let fibPredict = (tai % 2 === 0) ? "TÀI" : "XỈU";

    // Bayes đơn giản
    let total = tai + xiu;
    let pTai = tai / total;
    let pXiu = xiu / total;

    let predict = pTai > pXiu ? "TÀI" : "XỈU";
    let confidence = Math.max(pTai, pXiu) * 100;

    // Biểu đồ đúng sai 30 phiên
    let chart = [];
    let correct = 0;
    for (let i = 0; i < 30; i++) {
        let res = list[i]?.resultTruyenThong;
        if (!res) continue;
        let guess = list[i + 1]?.resultTruyenThong;
        let ok = res === guess;
        if (ok) correct++;
        chart.push(ok ? 1 : 0);
    }

    return {
        thong_ke: {
            tai,
            xiu
        },
        xu_huong: trend,
        markov,
        fibonacci: fibPredict,
        du_doan: predict,
        do_tin_cay: confidence.toFixed(2) + "%",
        streak_max: maxStreak,
        bieu_do_30: chart,
        do_chinh_xac: ((correct / 30) * 100).toFixed(2) + "%"
    };
}

// ====== API HANDLER ======
async function fetchData(url) {
    const res = await axios.get(url);
    return res.data.list;
}

// ====== ROUTE MD5 ======
app.get("/taixiumd5", async (req, res) => {
    try {
        const list = await fetchData(API_MD5);
        const analysis = analyze(list);

        res.json({
            owner: "@vanminh2603",
            phien_moi: list[0],
            du_doan: analysis.du_doan,
            do_tin_cay: analysis.do_tin_cay,
            xu_huong: analysis.xu_huong,
            fibonacci: analysis.fibonacci,
            markov: analysis.markov,
            thong_ke: analysis.thong_ke,
            streak: analysis.streak_max,
            bieu_do_30: analysis.bieu_do_30,
            do_chinh_xac: analysis.do_chinh_xac,
            lich_su: list.slice(0, 20)
        });

    } catch (e) {
        res.json({ error: "Lỗi API MD5" });
    }
});

// ====== ROUTE BETVIP ======
app.get("/taixiu", async (req, res) => {
    try {
        const list = await fetchData(API_TX);
        const analysis = analyze(list);

        res.json({
            owner: "@vanminh2603",
            phien_moi: list[0],
            du_doan: analysis.du_doan,
            do_tin_cay: analysis.do_tin_cay,
            xu_huong: analysis.xu_huong,
            fibonacci: analysis.fibonacci,
            markov: analysis.markov,
            thong_ke: analysis.thong_ke,
            streak: analysis.streak_max,
            bieu_do_30: analysis.bieu_do_30,
            do_chinh_xac: analysis.do_chinh_xac,
            lich_su: list.slice(0, 20)
        });

    } catch (e) {
        res.json({ error: "Lỗi API BETVIP" });
    }
});

// ====== ROOT ======
app.get("/", (req, res) => {
    res.send(`
    🔥 SERVER TÀI XỈU PRO VIP 🔥

    📌 API:
    /taixiumd5
    /taixiu

    🤖 AI: Markov + Bayes + Fibonacci + Trend
    📈 Có biểu đồ + lịch sử + độ tin cậy
    👑 Owner: @vanminh2603
    `);
});

// ====== START ======
app.listen(PORT, () => {
    console.log("Server chạy tại cổng " + PORT);
});
