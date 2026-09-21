/*
 * trade-form.js — shared by Journal.html and model.html (both have the same Add/Edit Trade modal).
 *
 *  TradeForm  : Add Trade settings (Auto Fill Data / Default Risk % / Account Size), live auto-fill of
 *               Result % and Profit/Loss USD, screenshot preview + resilient screenshot reading.
 *  TradeStore : safe localStorage writer for the "trades" array (screenshots are big base64 strings and
 *               can exceed the ~5 MB localStorage quota) + hand-off of the cloud copy of trades.
 *
 * Nothing here changes the stored trade shape: {resultR, returnPct, pnlUSD, risk, screenshot, ...}
 */
(function () {
    "use strict";

    var SETTINGS_KEY = "tradeFormSettings";
    var DECIMALS = 8;                 // max decimal places supported by every numeric field
    var MAX_SHOT_CHARS = 450000;      // per-screenshot cap (base64 chars) — keeps each Firestore doc far below 1 MiB

    // ---------- number helpers ------------------------------------------------------------------------
    function roundN(v) { return Number(v.toFixed(DECIMALS)); }           // strips float noise (0.1*3 -> 0.3), keeps 8 dp

    function fmt(v) {                                                    // number -> plain decimal string (no "1e-7")
        var s = roundN(v).toFixed(DECIMALS).replace(/\.?0+$/, "");
        return (s === "" || s === "-0" || s === "-") ? "0" : s;
    }

    function positive(v) {
        var n = typeof v === "number" ? v : parseFloat(v);
        return isFinite(n) && n > 0 ? n : null;
    }

    // Result % = R x Risk % ;  Risk Amount = Account x Risk % / 100 ; P/L = Risk Amount x R
    function calc(resultR, riskPct, accountSize) {
        var out = { returnPct: null, pnlUSD: null };
        if (typeof resultR !== "number" || typeof riskPct !== "number" || !isFinite(resultR) || !isFinite(riskPct)) return out;
        out.returnPct = roundN(resultR * riskPct);
        if (typeof accountSize === "number" && isFinite(accountSize) && accountSize > 0) {
            out.pnlUSD = roundN((accountSize * riskPct / 100) * resultR);
        }
        return out;
    }

    // ---------- settings ------------------------------------------------------------------------------
    function loadSettings() {
        var s = { autoFill: false, defaultRisk: null, accountSize: null };
        try {
            var raw = JSON.parse(localStorage.getItem(SETTINGS_KEY));
            if (raw && typeof raw === "object") {
                s.autoFill = raw.autoFill === true;
                s.defaultRisk = positive(raw.defaultRisk);
                s.accountSize = positive(raw.accountSize);
            }
        } catch (e) { /* corrupt value -> defaults */ }
        return s;
    }

    var settings = loadSettings();
    var cloudTimer = null;

    function persistSettings() {
        try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { console.error("Settings save failed:", e); }
        clearTimeout(cloudTimer);
        cloudTimer = setTimeout(function () {
            if (window.cloudSaveField) window.cloudSaveField(SETTINGS_KEY, settings);
        }, 500);
    }

    // ---------- DOM ----------------------------------------------------------------------------------
    function $(id) { return document.getElementById(id); }

    function numOf(el) {
        if (!el || el.value === "") return null;
        var n = Number(el.value);
        return isFinite(n) ? n : null;
    }

    function setAuto(el, value) {           // never overwrite something the user typed by hand in this session
        if (!el || el.dataset.userEdited === "1") return;
        el.value = value === null ? "" : fmt(value);
    }

    function applyAuto() {
        if (!settings.autoFill) return;
        var c = calc(numOf($("resultR")), numOf($("risk")), settings.accountSize);
        setAuto($("returnPct"), c.returnPct);
        if (settings.accountSize !== null) setAuto($("pnlUSD"), c.pnlUSD);   // no account size -> leave P/L alone
    }

    function resetAutoFlags() {
        ["returnPct", "pnlUSD"].forEach(function (id) {
            var el = $(id);
            if (el) delete el.dataset.userEdited;
        });
    }

    function syncSettingsUI() {
        if ($("tsAutoFill")) $("tsAutoFill").checked = settings.autoFill;
        if ($("tsDefaultRisk")) $("tsDefaultRisk").value = settings.defaultRisk === null ? "" : fmt(settings.defaultRisk);
        if ($("tsAccountSize")) $("tsAccountSize").value = settings.accountSize === null ? "" : fmt(settings.accountSize);
        var form = $("tradeForm");
        if (form) form.classList.toggle("autofill-on", settings.autoFill);
    }

    // ---------- screenshot preview -------------------------------------------------------------------
    function showCurrentShot(dataUrl) {
        var box = $("screenshotCurrent"), img = $("screenshotCurrentImg");
        if (!box || !img) return;
        if (dataUrl) { img.src = dataUrl; box.style.display = "flex"; }
        else { img.removeAttribute("src"); box.style.display = "none"; }
        var note = $("screenshotNote");
        if (note) note.textContent = "Current screenshot — kept unless you choose a new file below.";
    }

    function clearFileInput() {
        var f = $("screenshot");
        if (f) f.value = "";
    }

    function warnBadImage() {
        var msg = "This image couldn't be read, so the trade will be saved without changing its screenshot.";
        if (window.customAlert) window.customAlert(msg); else alert(msg);
    }

    function compress(img) {
        var steps = [[800, 0.7], [800, 0.55], [640, 0.55], [480, 0.5], [360, 0.45]];   // first step = the original behaviour
        var out = null;
        for (var i = 0; i < steps.length; i++) {
            var w = img.width > steps[i][0] ? steps[i][0] : img.width;
            var h = img.height * (w / img.width);
            var canvas = document.createElement("canvas");
            canvas.width = w; canvas.height = h;
            var ctx = canvas.getContext("2d");
            ctx.fillStyle = "#fff";                     // JPEG has no alpha: avoid black backgrounds for transparent PNGs
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);
            out = canvas.toDataURL("image/jpeg", steps[i][1]);
            if (out.length <= MAX_SHOT_CHARS) break;
        }
        return out;
    }

    // Resolves with a data URL, or null when there is no new file / the file is unreadable.
    // (Old code never handled img.onerror, so an unreadable image made "Save Trade" silently do nothing.)
    function resolveScreenshot(file) {
        return new Promise(function (resolve) {
            if (!file) return resolve(null);
            var reader = new FileReader();
            reader.onerror = function () { warnBadImage(); resolve(null); };
            reader.onload = function (e) {
                var img = new Image();
                img.onerror = function () { warnBadImage(); resolve(null); };
                img.onload = function () {
                    try { resolve(compress(img)); } catch (err) { console.error(err); warnBadImage(); resolve(null); }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // ---------- public TradeForm ---------------------------------------------------------------------
    var TradeForm = {
        calc: calc,
        fmt: fmt,
        getSettings: function () { return Object.assign({}, settings); },
        resolveScreenshot: resolveScreenshot,

        // "Add Trade" opened (fresh form)
        onOpenNew: function () {
            resetAutoFlags();
            clearFileInput();
            showCurrentShot("");
            syncSettingsUI();
            var panel = $("tradeSettingsPanel");
            if (panel) panel.style.display = "none";
            if (settings.defaultRisk !== null && $("risk")) $("risk").value = fmt(settings.defaultRisk);
        },

        // "Edit Trade" opened: existing values are shown untouched (nothing is recomputed until R / Risk change)
        onOpenEdit: function (trade) {
            resetAutoFlags();
            clearFileInput();
            showCurrentShot(trade && trade.screenshot);
            syncSettingsUI();
            var panel = $("tradeSettingsPanel");
            if (panel) panel.style.display = "none";
        },

        onClose: function () {
            clearFileInput();
            showCurrentShot("");
        },

        reloadSettings: function () {          // called after a cloud sync brought newer settings
            settings = loadSettings();
            syncSettingsUI();
        }
    };

    function bind() {
        var R = $("resultR"), risk = $("risk");
        if (R) R.addEventListener("input", applyAuto);
        if (risk) risk.addEventListener("input", applyAuto);

        ["returnPct", "pnlUSD"].forEach(function (id) {
            var el = $(id);
            if (!el) return;
            el.addEventListener("input", function () {       // only real user typing fires "input" (we set .value silently)
                if (el.value === "") delete el.dataset.userEdited; else el.dataset.userEdited = "1";
            });
        });

        var btn = $("tradeSettingsBtn"), panel = $("tradeSettingsPanel");
        if (btn && panel) {
            btn.addEventListener("click", function () {
                panel.style.display = panel.style.display === "block" ? "none" : "block";
            });
        }

        var af = $("tsAutoFill"), dr = $("tsDefaultRisk"), ac = $("tsAccountSize");
        if (af) af.addEventListener("change", function () {
            settings.autoFill = af.checked;
            persistSettings();
            $("tradeForm").classList.toggle("autofill-on", settings.autoFill);
            if (settings.autoFill) { resetAutoFlags(); applyAuto(); }
        });
        if (dr) dr.addEventListener("input", function () { settings.defaultRisk = positive(dr.value); persistSettings(); });
        if (ac) ac.addEventListener("input", function () { settings.accountSize = positive(ac.value); persistSettings(); applyAuto(); });

        var file = $("screenshot");
        if (file) file.addEventListener("change", function () {
            var note = $("screenshotNote");
            if (note && file.files && file.files[0] && $("screenshotCurrent") && $("screenshotCurrent").style.display !== "none") {
                note.textContent = "The new file will replace the current screenshot when you save.";
            }
        });

        syncSettingsUI();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind); else bind();
    window.addEventListener("cloudDataReady", function () { TradeForm.reloadSettings(); });
    window.addEventListener("cloudUserCleared", function () { TradeForm.reloadSettings(); });

    // ---------- TradeStore ---------------------------------------------------------------------------
    var warned = false;
    function notifyOnce(fatal) {
        if (warned) return;
        warned = true;
        var msg = fatal
            ? "Couldn't save on this device: browser storage is full. Export a JSON backup and remove old screenshots."
            : (window.currentUser
                ? "Browser storage is full, so screenshots are now kept in your cloud account only (they load when you're signed in)."
                : "Browser storage is full, so screenshots can't be kept on this device. Sign in to store them in the cloud, or export a JSON backup.");
        if (window.customAlert) window.customAlert(msg); else alert(msg);
    }

    var TradeStore = {
        // Writes the trades array. If the full array (with screenshots) doesn't fit, keeps everything except
        // the screenshots locally instead of throwing — the in-memory array and the cloud copy stay complete.
        saveLocal: function (list) {
            try {
                localStorage.setItem("trades", JSON.stringify(list));
                return { ok: true, stripped: false };
            } catch (e) {
                try {
                    var lite = list.map(function (t) { return t && t.screenshot ? Object.assign({}, t, { screenshot: "" }) : t; });
                    localStorage.setItem("trades", JSON.stringify(lite));
                    notifyOnce(false);
                    return { ok: true, stripped: true };
                } catch (e2) {
                    console.error("Local trades save failed:", e2);
                    notifyOnce(true);
                    return { ok: false, stripped: false };
                }
            }
        },

        // Trades for the UI: the fresh cloud copy when a sync just delivered one (it has the screenshots even if
        // localStorage couldn't hold them), otherwise whatever is in localStorage.
        load: function () {
            if (Array.isArray(window.__cloudTrades)) {
                var fresh = window.__cloudTrades;
                window.__cloudTrades = null;          // consume once so a later failed sync can never resurrect a stale copy
                return fresh;
            }
            try { return JSON.parse(localStorage.getItem("trades")) || []; } catch (e) { return []; }
        }
    };

    window.TradeForm = TradeForm;
    window.TradeStore = TradeStore;
})();
