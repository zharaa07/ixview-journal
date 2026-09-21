/*
 * balance-engine.js — the ONE place that computes the compounded account balance.
 *
 * Every operation that touches trades (Add / Edit / Delete / Import / Cloud sync / Model page / page load)
 * calls IxBalance.rebuild(trades). Nothing else in the app computes balanceBefore / balanceAfter /
 * riskAmount / pnlUSD / returnPct.
 *
 *   riskAmount    = balanceBefore x (risk% / 100)
 *   pnlUSD        = riskAmount x resultR
 *   balanceAfter  = balanceBefore + pnlUSD
 *   returnPct     = risk% x resultR                (= pnlUSD / balanceBefore x 100)
 *
 * The chain runs in chronological order: Date+Time, then createdAt, then id (stable across devices).
 * The first trade starts from the initial balance (Account Size setting, 100 when never set — the same
 * percentage index the equity curve always used). Each following trade starts from the previous balanceAfter.
 * A trade may carry `balanceAnchor` (a manual balanceBefore, e.g. after a deposit/withdrawal) which restarts
 * the chain from that value.
 *
 * Nothing is rounded here: full double precision is stored, rounding is a display concern only.
 */
(function () {
    "use strict";

    var DEFAULT_BASE = 100;
    var SETTINGS_KEY = "tradeFormSettings";

    function isNum(v) { return typeof v === "number" && isFinite(v); }

    function initialBalance() {
        try {
            var s = JSON.parse(localStorage.getItem(SETTINGS_KEY));
            if (s && isNum(s.accountSize) && s.accountSize > 0) return s.accountSize;
        } catch (e) { /* fall through */ }
        return DEFAULT_BASE;
    }

    // "2026-09-21T10:30" is local time; a bare "2026-09-21" must be local midnight too (Date.parse would read it as UTC).
    function timeOf(t) {
        var d = t && t.date;
        if (typeof d !== "string" || !d) return Infinity;
        var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
        var ms = m ? new Date(+m[1], +m[2] - 1, +m[3]).getTime() : Date.parse(d);
        return isNaN(ms) ? Infinity : ms;
    }

    function cmp(a, b) {
        var ta = timeOf(a.t), tb = timeOf(b.t);
        if (ta !== tb) return ta < tb ? -1 : 1;
        var ca = isNum(a.t.createdAt) ? a.t.createdAt : 0, cb = isNum(b.t.createdAt) ? b.t.createdAt : 0;
        if (ca !== cb) return ca < cb ? -1 : 1;
        var ia = String(a.t.id || ""), ib = String(b.t.id || "");
        if (ia !== ib) return ia < ib ? -1 : 1;
        return a.i - b.i;
    }

    function sortTrades(list) {
        return (list || []).map(function (t, i) { return { t: t, i: i }; }).sort(cmp).map(function (x) { return x.t; });
    }

    function same(a, b) { return a === b || (a === undefined && b === undefined); }
    function differs(a, b) { return Math.abs(a - b) > 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)); }

    var FIELDS = ["balanceBefore", "riskAmount", "pnlUSD", "balanceAfter", "returnPct"];

    // Recomputes the whole chain in place. Returns the trades whose stored values changed (so callers persist only those).
    function rebuild(list) {
        var ordered = sortTrades((list || []).filter(function (t) { return t && typeof t === "object"; }));
        var base = initialBalance();
        var changed = [];
        var prevAfter = null;
        var growth = 1, net = 0;
        var first = null;

        ordered.forEach(function (t) {
            var before = (isNum(t.balanceAnchor) && t.balanceAnchor > 0) ? t.balanceAnchor : (prevAfter === null ? base : prevAfter);
            var R = isNum(t.resultR) ? t.resultR : 0;
            var risk = isNum(t.risk) && t.risk > 0 ? t.risk : 0;
            var riskBase = before > 0 ? before : 0;
            var riskAmount, pnl, ret;

            if (risk > 0) {
                riskAmount = riskBase * (risk / 100);
                pnl = riskAmount * R;
                ret = risk * R;
            } else if (isNum(t.returnPct) && t.returnPct !== 0) {          // old trade without a Risk %: keep its own percentage
                ret = t.returnPct;
                pnl = riskBase * ret / 100;
                riskAmount = R !== 0 ? Math.abs(pnl / R) : 0;
            } else if (isNum(t.pnlUSD) && t.pnlUSD !== 0) {                // old trade with only a $ result
                pnl = t.pnlUSD;
                ret = riskBase > 0 ? pnl / riskBase * 100 : 0;
                riskAmount = R !== 0 ? Math.abs(pnl / R) : 0;
            } else {
                pnl = 0; ret = 0; riskAmount = 0;
            }
            var after = before + pnl;

            // first time a trade is compounded: keep what the user had stored, if it differs (nothing is silently lost)
            if (t.balanceAfter === undefined && !t.legacy) {
                var lg = {};
                if (isNum(t.returnPct) && t.returnPct !== 0 && differs(t.returnPct, ret)) lg.returnPct = t.returnPct;
                if (isNum(t.pnlUSD) && t.pnlUSD !== 0 && differs(t.pnlUSD, pnl)) lg.pnlUSD = t.pnlUSD;
                if (Object.keys(lg).length) { t.legacy = lg; if (changed.indexOf(t) === -1) changed.push(t); }
            }

            var next = { balanceBefore: before, riskAmount: riskAmount, pnlUSD: pnl, balanceAfter: after, returnPct: ret };
            var dirty = false;
            FIELDS.forEach(function (k) { if (!same(t[k], next[k])) { t[k] = next[k]; dirty = true; } });
            if (dirty && changed.indexOf(t) === -1) changed.push(t);

            if (first === null) first = before;
            growth *= (1 + ret / 100);
            net += pnl;
            prevAfter = after;
        });

        return {
            ordered: ordered,
            changed: changed,
            initial: first === null ? base : first,
            current: prevAfter === null ? base : prevAfter,
            netProfit: net,
            growthPct: (growth - 1) * 100
        };
    }

    // Balance a NEW trade would start from if it were dated `dateStr` (used to pre-fill Account Size).
    function balanceAt(list, dateStr, excludeTrade) {
        var at = timeOf({ date: dateStr });
        var last = null;
        sortTrades(list).forEach(function (t) {
            if (t === excludeTrade || !isNum(t.balanceAfter)) return;
            if (timeOf(t) <= at) last = t;
        });
        return last ? last.balanceAfter : initialBalance();
    }

    // Read-only totals from the stored chain (used for exports and per-scope summaries): current balance, net profit, growth.
    function summary(list) {
        var ordered = sortTrades(list).filter(function (t) { return isNum(t.balanceAfter); });
        var growth = 1, net = 0;
        ordered.forEach(function (t) {
            growth *= (1 + (isNum(t.returnPct) ? t.returnPct : 0) / 100);
            net += isNum(t.pnlUSD) ? t.pnlUSD : 0;
        });
        return {
            initial: ordered.length ? ordered[0].balanceBefore : initialBalance(),
            current: ordered.length ? ordered[ordered.length - 1].balanceAfter : initialBalance(),
            netProfit: net,
            growthPct: (growth - 1) * 100
        };
    }

    function latestBalance(list) {
        var ordered = sortTrades(list).filter(function (t) { return isNum(t.balanceAfter); });
        return ordered.length ? ordered[ordered.length - 1].balanceAfter : initialBalance();
    }

    // Manual Account Size for one trade. If the typed value is what the chain already gives, no anchor is stored
    // (so later edits keep flowing); otherwise the trade restarts the chain from the typed value.
    function setManualBalance(list, trade, value) {
        if (!isNum(value) || value <= 0) return;
        delete trade.balanceAnchor;
        rebuild(list);
        var tol = 1e-9 * Math.max(1, Math.abs(value));
        if (Math.abs(trade.balanceBefore - value) > tol) trade.balanceAnchor = value;
    }

    window.IxBalance = {
        rebuild: rebuild,
        sortTrades: sortTrades,
        balanceAt: balanceAt,
        latestBalance: latestBalance,
        summary: summary,
        initialBalance: initialBalance,
        setManualBalance: setManualBalance,
        provider: function () { return []; }     // each page registers () => its full trades array
    };
})();
