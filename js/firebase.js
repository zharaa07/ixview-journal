

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-analytics.js";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    getRedirectResult,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDoc,
    getDocs,
    setDoc,
    deleteDoc,
    collection,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBDK5WOg0_5zw3LSGBPjbNyagY0y_xwxHI",
    authDomain: "ixview.firebaseapp.com",
    projectId: "ixview",
    storageBucket: "ixview.firebasestorage.app",
    messagingSenderId: "34392940261",
    appId: "1:34392940261:web:ca09bc2bb862176b857e0c",
    measurementId: "G-7THLK4MKM8"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

window.firebaseAuth = auth;
window.firestoreDb = db;
window.currentUser = null;


function isEmailUnverified() {
    if (!window.currentUser) return false;
    const isPasswordAccount = window.currentUser.providerData.some(
        p => p.providerId === "password"
    );
    return isPasswordAccount && !window.currentUser.emailVerified;
}

function blockIfUnverified() {
    if (isEmailUnverified()) {
        const msg = "Please verify your email address before saving or editing data.";
        if (window.customAlert) window.customAlert(msg);
        else alert(msg);
        return true;
    }
    return false;
}


function sanitizeTrades(arr) {
    if (!Array.isArray(arr)) return [];
    arr.forEach(t => {
        if (typeof t.resultR !== "number" || !isFinite(t.resultR)) {
            t.resultR = 0;
        }
    });
    return arr;
}


// Trades carry base64 screenshots, so writes must respect Firestore limits (1 MiB per document,
// ~10 MiB per commit) and failures must be visible instead of silently losing the image.
const MAX_BATCH_BYTES = 6000000;
let lastCloudFailureNotice = 0;

function notifyCloudFailure(err) {
    console.error("Cloud trade write failed:", err);
    const now = Date.now();
    if (now - lastCloudFailureNotice < 60000) return;
    lastCloudFailureNotice = now;
    const msg = "The trade was saved on this device, but syncing it to your account failed. Check your connection and save it again.";
    if (window.customAlert) window.customAlert(msg); else alert(msg);
}

function saveTradesLocal(list) {
    if (window.TradeStore) return window.TradeStore.saveLocal(list);
    localStorage.setItem("trades", JSON.stringify(list));
}

window.cloudSaveField = async function (fieldName, value) {
    if (!window.currentUser) return;
    if (blockIfUnverified()) return;
    try {
        await setDoc(
            doc(db, "users", window.currentUser.uid),
            { [fieldName]: value, updatedAt: Date.now() },
            { merge: true }
        );
    } catch (err) {
        console.error("Cloud save failed (" + fieldName + "):", err);
    }
};

window.generateTradeId = function () {
    if (window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }
    return "trade_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
};


window.cloudSaveTrade = async function (trade) {
    if (!window.currentUser) return;
    if (blockIfUnverified()) return;
    if (!trade.id) trade.id = window.generateTradeId();
    if (typeof trade.resultR !== "number" || !isFinite(trade.resultR)) {
        trade.resultR = 0;
    }
    try {
        await setDoc(
            doc(db, "users", window.currentUser.uid, "trades", trade.id),
            trade
        );
    } catch (err) {
        notifyCloudFailure(err);
        return null;
    }
    return trade.id;
};

window.cloudDeleteTrade = async function (tradeId) {
    if (!window.currentUser || !tradeId) return;
    try {
        await deleteDoc(
            doc(db, "users", window.currentUser.uid, "trades", tradeId)
        );
    } catch (err) {
        console.error("Failed to delete trade from the cloud:", err);
    }
};


window.cloudBulkSaveTrades = async function (tradesArray) {
    if (!window.currentUser || !tradesArray || tradesArray.length === 0) return;
    sanitizeTrades(tradesArray);
    const uid = window.currentUser.uid;

    // Old code batched a fixed 400 trades per commit. With screenshots (~100 KB each) that is ~40 MB, far above
    // Firestore's ~10 MiB commit limit, so the batch failed (first login / migration / import of many trades)
    // and the trades never reached the cloud. Now a batch closes as soon as it nears the byte budget.
    let chunk = [];
    let bytes = 0;
    const flush = async () => {
        if (chunk.length === 0) return;
        const batch = writeBatch(db);
        chunk.forEach(t => batch.set(doc(db, "users", uid, "trades", t.id), t));
        await batch.commit();
        chunk = [];
        bytes = 0;
    };

    for (const t of tradesArray) {
        if (!t.id) t.id = window.generateTradeId();
        let size = 0;
        try { size = JSON.stringify(t).length * 1.1 + 200; } catch (e) { size = 1000; }
        if (chunk.length > 0 && (chunk.length >= 400 || bytes + size > MAX_BATCH_BYTES)) await flush();
        chunk.push(t);
        bytes += size;
    }
    await flush();
};


// When the balance chain changes (an earlier trade was edited / deleted / imported), the later trades get new
// balanceBefore / balanceAfter / riskAmount / pnlUSD / returnPct. Only those small derived fields are sent
// (merge), never the whole trade — so screenshots and everything else in the cloud copy stay untouched.
const DERIVED_TRADE_FIELDS = ["balanceBefore", "riskAmount", "pnlUSD", "balanceAfter", "returnPct", "legacy"];

window.cloudUpdateTradeFields = async function (tradesArray) {
    if (!window.currentUser || !tradesArray || tradesArray.length === 0) return;
    if (blockIfUnverified()) return;
    const uid = window.currentUser.uid;
    try {
        for (let i = 0; i < tradesArray.length; i += 400) {
            const batch = writeBatch(db);
            tradesArray.slice(i, i + 400).forEach(t => {
                if (!t || !t.id) return;
                const part = {};
                DERIVED_TRADE_FIELDS.forEach(k => { if (t[k] !== undefined) part[k] = t[k]; });
                batch.set(doc(db, "users", uid, "trades", t.id), part, { merge: true });
            });
            await batch.commit();
        }
    } catch (err) {
        notifyCloudFailure(err);
        throw err;
    }
};

function clearLocalUserCache() {
    ["trades", "modelsList", "mistakesList", "tagsList", "emotionsList", "lastSyncedUid", "ixview-theme", "pdDashboardSettings", "tradeFormSettings"]
        .forEach(k => localStorage.removeItem(k));
    window.__cloudTrades = null;
    window.dispatchEvent(new CustomEvent("cloudUserCleared"));
}

const AUTH_ERROR_MESSAGES = {
    "auth/email-already-in-use": "This email is already registered. Try signing in instead.",
    "auth/invalid-email": "Invalid email format.",
    "auth/weak-password": "Password is too weak — use at least 6 characters.",
    "auth/missing-password": "Please enter a password.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/too-many-requests": "Too many attempts, please try again later.",
    "auth/network-request-failed": "Check your internet connection and try again."
};

function mapAuthError(err) {
    if (err && err.code && AUTH_ERROR_MESSAGES[err.code]) {
        return AUTH_ERROR_MESSAGES[err.code];
    }
    return "Something went wrong, please try again.";
}

window.signUpWithEmail = async function (email, password) {
    if (window.authDebugLog) window.authDebugLog("Email Sign Up", "start", { email: email });
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (window.authDebugLog) window.authDebugLog("Email Sign Up", "success", { uid: cred.user.uid });
        try {
            await sendEmailVerification(cred.user);
            if (window.authDebugLog) window.authDebugLog("Email Verification", "success", { step: "verification email sent" });
        } catch (verifyErr) {
            console.error("Failed to send verification email:", verifyErr);
            if (window.authDebugLog) window.authDebugLog("Email Verification", "error", { code: verifyErr.code, message: verifyErr.message, name: verifyErr.name });
        }
        return { ok: true };
    } catch (err) {
        console.error("Sign up error:", err);
        if (window.authDebugLog) window.authDebugLog("Email Sign Up", "error", { code: err.code, message: err.message, name: err.name });
        return { ok: false, message: mapAuthError(err) };
    }
};

window.loginWithEmail = async function (email, password) {
    if (window.authDebugLog) window.authDebugLog("Email Login", "start", { email: email });
    try {
        await signInWithEmailAndPassword(auth, email, password);
        if (window.authDebugLog) window.authDebugLog("Email Login", "success", {});
        return { ok: true };
    } catch (err) {
        console.error("Email sign-in error:", err);
        if (window.authDebugLog) window.authDebugLog("Email Login", "error", { code: err.code, message: err.message, name: err.name });
        return { ok: false, message: mapAuthError(err) };
    }
};

window.sendPasswordReset = async function (email) {
    if (window.authDebugLog) window.authDebugLog("Password Reset", "start", { email: email });
    try {
        await sendPasswordResetEmail(auth, email);
        if (window.authDebugLog) window.authDebugLog("Password Reset", "success", {});
        return { ok: true };
    } catch (err) {
        console.error("Password reset error:", err);
        if (window.authDebugLog) window.authDebugLog("Password Reset", "error", { code: err.code, message: err.message, name: err.name });
        return { ok: false, message: mapAuthError(err) };
    }
};

window.resendVerificationEmail = async function () {
    if (!window.currentUser) return;
    if (window.authDebugLog) window.authDebugLog("Resend Verification", "start", {});
    try {
        await sendEmailVerification(window.currentUser);
        if (window.authDebugLog) window.authDebugLog("Resend Verification", "success", {});
        const msg = "A new verification email has been sent to your inbox.";
        if (window.customAlert) window.customAlert(msg); else alert(msg);
    } catch (err) {
        console.error("Failed to resend verification email:", err);
        if (window.authDebugLog) window.authDebugLog("Resend Verification", "error", { code: err.code, message: err.message, name: err.name });
        const msg = "Could not send the email, please try again later.";
        if (window.customAlert) window.customAlert(msg); else alert(msg);
    }
};

async function loadTradesFromCloud(uid) {
    const snap = await getDocs(collection(db, "users", uid, "trades"));
    const result = [];
    snap.forEach(d => result.push(d.data()));
    return sanitizeTrades(result);
}

async function migrateTradesIfNeeded(uid, userData) {
    if (userData.migrationVersion === 2) return;

    const localTradesRaw = localStorage.getItem("trades");
    const localTrades = sanitizeTrades(localTradesRaw ? JSON.parse(localTradesRaw) : []);

    if (localTrades.length > 0) {
        localTrades.forEach(t => {
            if (!t.id) t.id = window.generateTradeId();
        });
        if (window.IxBalance) window.IxBalance.rebuild(localTrades);     // upload the compounded chain, not stale values
        await window.cloudBulkSaveTrades(localTrades);
        saveTradesLocal(localTrades);
    }

    await setDoc(
        doc(db, "users", uid),
        { migrationVersion: 2 },
        { merge: true }
    );
}


async function syncUserData(user) {
    const uid = user.uid;
    const userRef = doc(db, "users", uid);
    const statusEl = document.getElementById("syncStatus");
    if (statusEl) statusEl.textContent = "Syncing...";
    window.__cloudTrades = null;   // only a *successful* sync below may hand a fresh cloud copy to the UI

    try {
        const snap = await getDoc(userRef);
        const data = snap.exists() ? snap.data() : {};

        if (data.modelsList) {
            localStorage.setItem("modelsList", JSON.stringify(data.modelsList));
        }
        if (data.mistakesList) {
            localStorage.setItem("mistakesList", JSON.stringify(data.mistakesList));
        }
        if (data.tagsList) {
            localStorage.setItem("tagsList", JSON.stringify(data.tagsList));
        }
        if (data.emotionsList) {
            localStorage.setItem("emotionsList", JSON.stringify(data.emotionsList));
        }
        if (data.theme) {
            localStorage.setItem("ixview-theme", data.theme);
        }
        if (data.pdDashboardSettings) {
            localStorage.setItem("pdDashboardSettings", JSON.stringify(data.pdDashboardSettings));
        }
        if (data.tradeFormSettings) {
            localStorage.setItem("tradeFormSettings", JSON.stringify(data.tradeFormSettings));
        }

        if (data.migrationVersion === 2) {
            const cloudTrades = await loadTradesFromCloud(uid);
            // Hand the complete cloud copy (with screenshots) straight to the UI; localStorage is only a cache and
            // may be too small to hold every screenshot (saveTradesLocal then keeps the trades without images).
            const chain = window.IxBalance ? window.IxBalance.rebuild(cloudTrades) : { changed: [] };
            window.__cloudTrades = cloudTrades;
            saveTradesLocal(cloudTrades);
            // Older cloud copies have no balances yet (or an earlier trade changed elsewhere): store the rebuilt chain once.
            if (chain.changed.length) window.cloudUpdateTradeFields(chain.changed).catch(() => {});
        } else {
            await migrateTradesIfNeeded(uid, data);

            const topLevelUpdate = {};
            if (!data.modelsList) {
                const m = localStorage.getItem("modelsList");
                if (m) topLevelUpdate.modelsList = JSON.parse(m);
            }
            if (!data.mistakesList) {
                const mk = localStorage.getItem("mistakesList");
                if (mk) topLevelUpdate.mistakesList = JSON.parse(mk);
            }
            if (!data.tagsList) {
                const tg = localStorage.getItem("tagsList");
                if (tg) topLevelUpdate.tagsList = JSON.parse(tg);
            }
            if (!data.emotionsList) {
                const em = localStorage.getItem("emotionsList");
                if (em) topLevelUpdate.emotionsList = JSON.parse(em);
            }
            if (!data.theme) {
                const th = localStorage.getItem("ixview-theme");
                if (th) topLevelUpdate.theme = th;
            }
            if (!data.pdDashboardSettings) {
                const pd = localStorage.getItem("pdDashboardSettings");
                if (pd) topLevelUpdate.pdDashboardSettings = JSON.parse(pd);
            }
            if (!data.tradeFormSettings) {
                const ts = localStorage.getItem("tradeFormSettings");
                if (ts) topLevelUpdate.tradeFormSettings = JSON.parse(ts);
            }
            if (Object.keys(topLevelUpdate).length > 0) {
                await setDoc(userRef, topLevelUpdate, { merge: true });
            }
        }
    } catch (err) {
        console.error("Failed to sync data with Firestore:", err);
        if (statusEl) statusEl.textContent = "Sync failed";
        setTimeout(() => { if (statusEl) statusEl.textContent = ""; }, 3000);
        window.dispatchEvent(new CustomEvent("cloudDataReady"));
        return;
    }


    window.dispatchEvent(new CustomEvent("cloudDataReady"));
    if (statusEl) statusEl.textContent = "";
}



window.loginWithGoogle = async function () {
    if (window.authDebugLog) window.authDebugLog("Google Login START", "info", { userAgent: navigator.userAgent });
    if (window.authDebugLog) window.authDebugLog("Google Login METHOD: popup", "info", {});

    try {
        await signInWithPopup(auth, provider);
        if (window.authDebugLog) window.authDebugLog("Google Login SUCCESS", "success", { step: "popup" });
    } catch (err) {
        if (window.authDebugLog) window.authDebugLog("Google Login ERROR", "error", { code: err && err.code, message: err && err.message, name: err && err.name, step: "popup" });
        console.error("Google sign-in error:", err);
        const msg = (err && err.code === "auth/popup-blocked")
            ? "Your browser blocked the popup. Please allow popups for this site and try again."
            : "Sign-in failed, please try again.";
        if (window.customAlert) window.customAlert(msg);
        else alert(msg);
    }
};


if (window.authDebugLog) window.authDebugLog("Google Login REDIRECT RESULT", "info", { step: "checking on page load" });

if (window.authDebugLog) window.authDebugLog("Google Login REDIRECT RESULT", "info", { step: "checking on page load" });
getRedirectResult(auth).then((result) => {
    if (result && result.user) {
        if (window.authDebugLog) window.authDebugLog("Google Login SUCCESS", "success", { step: "redirect result", uid: result.user.uid });
    } else {
        
        if (window.authDebugLog) window.authDebugLog("Google Login REDIRECT RESULT", "info", { result: "none pending" });
    }
}).catch((err) => {
    console.error("Redirect result error:", err);
    if (window.authDebugLog) window.authDebugLog("Google Login ERROR", "error", { code: err && err.code, message: err && err.message, name: err && err.name, step: "redirect-result" });
});

window.logout = function () {
    if (window.authDebugLog) window.authDebugLog("Logout", "start", {});
    clearLocalUserCache();
    signOut(auth).then(() => {
        if (window.authDebugLog) window.authDebugLog("Logout", "success", {});
    }).catch((err) => {
        if (window.authDebugLog) window.authDebugLog("Logout", "error", { code: err.code, message: err.message, name: err.name });
    });
};

onAuthStateChanged(auth, (user) => {
    window.currentUser = user;

    if (window.authDebugLog) {
        window.authDebugLog("Auth State Changed", "info", {
            hasUser: user ? "yes" : "no",
            uid: user ? user.uid : "-",
            provider: user && user.providerData[0] ? user.providerData[0].providerId : "-"
        });
    }

    const loginBtn = document.getElementById("googleLoginBtn");
    const userInfo = document.getElementById("userInfo");
    const userPhoto = document.getElementById("userPhoto");
    const userName = document.getElementById("userName");

    if (!loginBtn || !userInfo) return;

    if (user) {
        loginBtn.style.display = "none";
        userInfo.style.display = "flex";
        userPhoto.src = user.photoURL || "";
        userName.textContent = user.displayName || user.email || "User";

        const verifyBanner = document.getElementById("emailVerifyBanner");
        if (verifyBanner) {
            verifyBanner.style.display = isEmailUnverified() ? "flex" : "none";
        }

        
        const lastUid = localStorage.getItem("lastSyncedUid");
        if (lastUid && lastUid !== user.uid) {
            clearLocalUserCache();
        }
        localStorage.setItem("lastSyncedUid", user.uid);

        syncUserData(user);
    } else {
        loginBtn.style.display = "flex";
        userInfo.style.display = "none";
        const verifyBanner = document.getElementById("emailVerifyBanner");
        if (verifyBanner) verifyBanner.style.display = "none";
    }
});


window.addEventListener("offline", function () {
    const statusEl = document.getElementById("syncStatus");
    if (statusEl) statusEl.textContent = "Offline";
});
window.addEventListener("online", function () {
    const statusEl = document.getElementById("syncStatus");
    if (statusEl && statusEl.textContent === "Offline") {
        statusEl.textContent = "";
        if (window.currentUser) syncUserData(window.currentUser);
    }
});


// واجهة نافذة Email/Password 

let authModalMode = "login"; // "login" | "signup"

window.openEmailAuthModal = function () {
    const modal = document.getElementById("emailAuthModal");
    if (!modal) return;
    modal.style.display = "flex";
    window.switchEmailAuthTab("login");
};

window.closeEmailAuthModal = function () {
    const modal = document.getElementById("emailAuthModal");
    if (!modal) return;
    modal.style.display = "none";
    const errEl = document.getElementById("emailAuthError");
    if (errEl) errEl.textContent = "";
    const emailInput = document.getElementById("emailAuthEmail");
    const passInput = document.getElementById("emailAuthPassword");
    if (emailInput) emailInput.value = "";
    if (passInput) passInput.value = "";
};

window.switchEmailAuthTab = function (mode) {
    authModalMode = mode;
    const loginTab = document.getElementById("emailAuthTabLogin");
    const signupTab = document.getElementById("emailAuthTabSignup");
    const submitBtn = document.getElementById("emailAuthSubmitBtn");
    const forgotLink = document.getElementById("emailAuthForgotLink");
    const errEl = document.getElementById("emailAuthError");
    if (errEl) errEl.textContent = "";

    if (loginTab && signupTab) {
        loginTab.classList.toggle("active", mode === "login");
        signupTab.classList.toggle("active", mode === "signup");
    }
    if (submitBtn) submitBtn.textContent = mode === "login" ? "Sign In" : "Sign Up";
    if (forgotLink) forgotLink.style.display = mode === "login" ? "inline" : "none";
};

window.submitEmailAuthForm = async function () {
    const emailInput = document.getElementById("emailAuthEmail");
    const passInput = document.getElementById("emailAuthPassword");
    const errEl = document.getElementById("emailAuthError");
    const submitBtn = document.getElementById("emailAuthSubmitBtn");
    if (!emailInput || !passInput) return;

    const email = emailInput.value.trim();
    const password = passInput.value;

    if (!email || !password) {
        if (errEl) errEl.textContent = "Please fill in all fields.";
        return;
    }

    if (submitBtn) submitBtn.disabled = true;
    const result = authModalMode === "login"
        ? await window.loginWithEmail(email, password)
        : await window.signUpWithEmail(email, password);
    if (submitBtn) submitBtn.disabled = false;

    if (result.ok) {
        window.closeEmailAuthModal();
    } else if (errEl) {
        errEl.textContent = result.message;
    }
};

window.forgotPasswordFlow = async function () {
    const emailInput = document.getElementById("emailAuthEmail");
    const errEl = document.getElementById("emailAuthError");
    let email = emailInput ? emailInput.value.trim() : "";

    if (!email && window.customPrompt) {
        email = await window.customPrompt("Enter your email address to receive a reset link:");
    }
    if (!email) return;

    const result = await window.sendPasswordReset(email);
    const msg = result.ok
        ? "A password reset link has been sent to your email."
        : result.message;

    if (result.ok) {
        window.closeEmailAuthModal();
        if (window.customAlert) window.customAlert(msg); else alert(msg);
    } else if (errEl) {
        errEl.textContent = msg;
    } else if (window.customAlert) {
        window.customAlert(msg);
    }
};
