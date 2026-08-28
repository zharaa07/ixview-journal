// ===================================================================
// js/auth-debug.js  —  ملف مؤقت للتشخيص فقط
// ===================================================================
// لوحة Debug مؤقتة لتشخيص مشكلة تسجيل الدخول التي كتبان بشكل مختلف
// بين المتصفحات. الملف مستقل بالكامل (كيبني الـ UI ديالو بـ JS، بلا
// حاجة لتعديل CSS/HTML) باش يكون سهل الحذف من بعد: كافي تمسح هاد
// الملف + سطر <script> ديالو، بلا ما تلمس أي حاجة أخرى.
//
// كيفاش تفعّل: زيد ?debug=1 فآخر الرابط (مثلاً https://.../Journal.html?debug=1)
// وغادي يبقى مفعّل (محفوظ فـ localStorage) حتى فالمرات الجاية، حتى بعد
// redirect ديال Google Login. باش تطفيه: ?debug=0.
//
// ممنوع تماماً: أي password / access token / id token / refresh token /
// api key / credential تدخل لهاد الملف. authDebugLog() فيها فلترة
// حماية إضافية (sanitizeDetails) كتشيل أي مفتاح كيشبه هاد الأسماء حتى
// لو تنسا حد يزيدها فمكان آخر بالغلط.
// ===================================================================

(function () {

    const STORAGE_MODE_KEY = "authDebugMode";
    const STORAGE_HIDDEN_KEY = "authDebugPanelHidden";
    const MAX_LOGS = 300;

    const SENSITIVE_KEY_PATTERNS = [
        "password", "accesstoken", "idtoken", "refreshtoken", "token",
        "apikey", "secret", "credential", "privatekey", "ststoken"
    ];

    let logs = [];
    let lastAction = null; // { action, status, details, time }
    let panelEl = null;
    let toggleEl = null;
    let logListEl = null;
    let headerEl = null;
    let lastActionEl = null;

    // ---------------------------------------------------------------
    // تفعيل/تعطيل وضع Debug عبر ?debug=1 / ?debug=0 فالرابط
    // ---------------------------------------------------------------
    function syncModeFromUrl() {
        try {
            const params = new URLSearchParams(window.location.search);
            if (params.has("debug")) {
                if (params.get("debug") === "0") {
                    localStorage.removeItem(STORAGE_MODE_KEY);
                } else {
                    localStorage.setItem(STORAGE_MODE_KEY, "1");
                }
            }
        } catch (e) { /* لا شيء */ }
    }

    function isDebugMode() {
        try {
            return localStorage.getItem(STORAGE_MODE_KEY) === "1";
        } catch (e) {
            return false;
        }
    }

    // ---------------------------------------------------------------
    // فلترة أي بيانات حساسة قبل ما تتسجل أو تتبين
    // ---------------------------------------------------------------
    function sanitizeDetails(details) {
        if (!details || typeof details !== "object") return details;
        const clean = {};
        Object.keys(details).forEach(function (k) {
            const lower = k.toLowerCase().replace(/[_\-\s]/g, "");
            if (SENSITIVE_KEY_PATTERNS.some(p => lower.includes(p))) return;
            let v = details[k];
            if (v && typeof v === "object") v = sanitizeDetails(v);
            clean[k] = v;
        });
        return clean;
    }

    function nowStr() {
        const d = new Date();
        return d.toTimeString().slice(0, 8);
    }

    // ---------------------------------------------------------------
    // الـ Logger المركزي — window.authDebugLog(action, status, details)
    // status: "start" | "success" | "error" | "info"
    // كيخدم حتى إذا وضع Debug ماشي مفعّل (كيسجل فالذاكرة بلا ما يبني
    // الواجهة) باش إذا المستخدم فعّل Debug من بعد حادثة، يلقى آخر
    // العمليات مسجلة.
    // ---------------------------------------------------------------
    window.authDebugLog = function (action, status, details) {
        const entry = {
            time: nowStr(),
            action: action,
            status: status,
            details: sanitizeDetails(details) || {}
        };
        logs.push(entry);
        if (logs.length > MAX_LOGS) logs.shift();
        if (status !== "info") lastAction = entry;

        if (isDebugMode()) {
            ensurePanelBuilt();
            renderLogs();
            renderLastAction();
            renderHeader();
        }
    };

    window.authDebugClear = function () {
        logs = [];
        lastAction = null;
        renderLogs();
        renderLastAction();
    };

    function buildReportText() {
        const lines = [];
        lines.push("=== AUTH DEBUG REPORT ===");
        lines.push("Time: " + new Date().toISOString());
        lines.push("URL: " + window.location.href);
        lines.push("Hostname: " + window.location.hostname);
        lines.push("User Agent: " + navigator.userAgent);
        lines.push("Online: " + (navigator.onLine ? "Yes" : "No"));
        lines.push("");
        lines.push("--- Logs (" + logs.length + ") ---");
        logs.forEach(function (l) {
            lines.push("[" + l.time + "] " + l.action + " — " + l.status.toUpperCase());
            Object.keys(l.details).forEach(function (k) {
                lines.push("  " + k + ": " + l.details[k]);
            });
        });
        return lines.join("\n");
    }

    window.authDebugCopyReport = async function () {
        const report = buildReportText();
        const btn = document.getElementById("authDebugCopyBtn");
        try {
            await navigator.clipboard.writeText(report);
            if (btn) { const old = btn.textContent; btn.textContent = "✓ تم النسخ"; setTimeout(() => btn.textContent = old, 1500); }
        } catch (e) {
            // فولباك: نافذة نص يقدر يسلكت ويكوبي يدوي
            if (window.customPrompt) window.customPrompt("انسخ التقرير يدويًا:", report);
            else prompt("انسخ التقرير يدويًا:", report);
        }
    };

    // ---------------------------------------------------------------
    // بناء الواجهة (مرة وحدة، غير كي يتفعل Debug)
    // ---------------------------------------------------------------
    function ensurePanelBuilt() {
        if (panelEl) return;

        const style = document.createElement("style");
        style.textContent = `
#authDebugPanel{position:fixed;bottom:0;left:0;right:0;max-height:60vh;
    background:#0d1117;color:#c9d1d9;font-family:monospace;font-size:11.5px;
    direction:ltr;text-align:left;z-index:99999;display:flex;flex-direction:column;
    border-top:2px solid #f0883e;box-shadow:0 -4px 16px rgba(0,0,0,.4);}
#authDebugPanel .adp-head{padding:8px 10px;border-bottom:1px solid #30363d;
    background:#161b22;white-space:pre-wrap;line-height:1.5;}
#authDebugPanel .adp-title{color:#f0883e;font-weight:bold;font-size:12.5px;}
#authDebugPanel .adp-last{padding:6px 10px;border-bottom:1px solid #30363d;
    background:#12161c;white-space:pre-wrap;line-height:1.5;}
#authDebugPanel .adp-logs{flex:1;overflow-y:auto;padding:6px 10px;}
#authDebugPanel .adp-log-line{white-space:pre-wrap;margin-bottom:6px;padding-bottom:6px;
    border-bottom:1px dashed #21262d;}
#authDebugPanel .adp-status-success{color:#3fb950;}
#authDebugPanel .adp-status-error{color:#f85149;}
#authDebugPanel .adp-status-start{color:#58a6ff;}
#authDebugPanel .adp-status-info{color:#8b949e;}
#authDebugPanel .adp-actions{display:flex;gap:6px;padding:8px 10px;border-top:1px solid #30363d;
    background:#161b22;}
#authDebugPanel .adp-actions button{flex:1;background:#21262d;color:#c9d1d9;
    border:1px solid #30363d;border-radius:6px;padding:8px 4px;font-size:11px;font-family:monospace;}
#authDebugPanel .adp-actions button:active{background:#30363d;}
#authDebugToggle{position:fixed;bottom:14px;left:14px;z-index:99998;
    background:#f0883e;color:#0d1117;border:none;border-radius:20px;
    padding:8px 14px;font-family:monospace;font-size:12px;font-weight:bold;
    box-shadow:0 2px 8px rgba(0,0,0,.4);}
`;
        document.head.appendChild(style);

        panelEl = document.createElement("div");
        panelEl.id = "authDebugPanel";

        headerEl = document.createElement("div");
        headerEl.className = "adp-head";

        lastActionEl = document.createElement("div");
        lastActionEl.className = "adp-last";

        logListEl = document.createElement("div");
        logListEl.className = "adp-logs";

        const actions = document.createElement("div");
        actions.className = "adp-actions";

        const clearBtn = document.createElement("button");
        clearBtn.textContent = "Clear Logs";
        clearBtn.onclick = window.authDebugClear;

        const copyBtn = document.createElement("button");
        copyBtn.id = "authDebugCopyBtn";
        copyBtn.textContent = "Copy Debug Report";
        copyBtn.onclick = window.authDebugCopyReport;

        const hideBtn = document.createElement("button");
        hideBtn.textContent = "Hide Debug";
        hideBtn.onclick = hidePanel;

        actions.appendChild(clearBtn);
        actions.appendChild(copyBtn);
        actions.appendChild(hideBtn);

        panelEl.appendChild(headerEl);
        panelEl.appendChild(lastActionEl);
        panelEl.appendChild(logListEl);
        panelEl.appendChild(actions);
        document.body.appendChild(panelEl);

        toggleEl = document.createElement("button");
        toggleEl.id = "authDebugToggle";
        toggleEl.textContent = "🐞 Debug";
        toggleEl.onclick = showPanel;
        document.body.appendChild(toggleEl);

        const startHidden = localStorage.getItem(STORAGE_HIDDEN_KEY) === "1";
        if (startHidden) hidePanel(); else showPanel();

        renderHeader();
        renderLastAction();
        renderLogs();

        // تحديث دوري لحالة الاتصال / auth init / current user، لأن هادوك
        // كيتبدلو من برا (firebase.js) بلا ما يمرو من authDebugLog دايمًا
        setInterval(renderHeader, 1500);
        window.addEventListener("online", renderHeader);
        window.addEventListener("offline", renderHeader);
    }

    function showPanel() {
        if (!panelEl) return;
        panelEl.style.display = "flex";
        toggleEl.style.display = "none";
        try { localStorage.setItem(STORAGE_HIDDEN_KEY, "0"); } catch (e) {}
    }

    function hidePanel() {
        if (!panelEl) return;
        panelEl.style.display = "none";
        toggleEl.style.display = "block";
        try { localStorage.setItem(STORAGE_HIDDEN_KEY, "1"); } catch (e) {}
    }

    function providerLabel() {
        const user = window.currentUser;
        if (!user || !user.providerData || !user.providerData[0]) return "-";
        const id = user.providerData[0].providerId;
        if (id === "google.com") return "Google";
        if (id === "password") return "Email/Password";
        return id;
    }

    function renderHeader() {
        if (!headerEl) return;
        const authInitialized = typeof window.firebaseAuth !== "undefined" && window.firebaseAuth !== null;
        const user = window.currentUser;
        const lines = [
            "AUTH DEBUG",
            "",
            "URL: " + window.location.href,
            "Hostname: " + window.location.hostname,
            "User Agent: " + navigator.userAgent,
            "",
            "Status: " + (navigator.onLine ? "Online" : "Offline"),
            "Auth initialized: " + (authInitialized ? "Yes" : "No"),
            "Current user: " + (user ? "Yes" : "No")
        ];
        if (user) {
            lines.push("UID: " + user.uid);
            lines.push("Provider: " + providerLabel());
            lines.push("Email verified: " + (user.emailVerified ? "Yes" : "No"));
        }
        headerEl.innerHTML =
            '<span class="adp-title">AUTH DEBUG</span>\n' +
            lines.slice(1).join("\n");
    }

    function renderLastAction() {
        if (!lastActionEl) return;
        if (!lastAction) {
            lastActionEl.textContent = "Last action: (none yet)";
            return;
        }
        const statusClass = "adp-status-" + lastAction.status;
        const statusLabel = lastAction.status === "success" ? "SUCCESS"
            : lastAction.status === "error" ? "FAILED"
            : lastAction.status.toUpperCase();

        let html = "Last action:\n" + lastAction.action +
            '\n\nResult:\n<span class="' + statusClass + '">' + statusLabel + "</span>";

        if (lastAction.status === "error") {
            if (lastAction.details.code) html += "\n\nError code:\n" + lastAction.details.code;
            if (lastAction.details.message) html += "\n\nError message:\n" + escapeHtml(lastAction.details.message);
            if (lastAction.details.name) html += "\n\nError name:\n" + lastAction.details.name;
        }
        lastActionEl.innerHTML = html;
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    }

    function renderLogs() {
        if (!logListEl) return;
        if (logs.length === 0) {
            logListEl.innerHTML = "(no logs yet)";
            return;
        }
        logListEl.innerHTML = logs.slice().reverse().map(function (l) {
            const statusClass = "adp-status-" + l.status;
            const statusLabel = l.status === "success" ? "SUCCESS"
                : l.status === "error" ? "FAILED"
                : l.status.toUpperCase();
            let line = "[" + l.time + "] " + escapeHtml(l.action) +
                ' <span class="' + statusClass + '">' + statusLabel + "</span>";
            Object.keys(l.details).forEach(function (k) {
                line += "\n  " + escapeHtml(k) + ": " + escapeHtml(l.details[k]);
            });
            return '<div class="adp-log-line">' + line + "</div>";
        }).join("");
    }

    // ---------------------------------------------------------------
    // نقطة الدخول
    // ---------------------------------------------------------------
    syncModeFromUrl();
    if (isDebugMode()) {
        if (document.body) ensurePanelBuilt();
        else document.addEventListener("DOMContentLoaded", ensurePanelBuilt);
    }

})();
