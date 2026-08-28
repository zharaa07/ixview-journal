// ===================================================================
// js/firebase.js
// كل منطق Firebase (Auth + Firestore) مركّز هنا، مشترك بين
// Journal.html و model.html، باش ما يتكررش الكود.
// ===================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-analytics.js";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
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

// true غير إذا المستخدم داخل بـ Email/Password وما فعلش بريده بعد.
// حسابات Google دايماً emailVerified = true من عند Firebase، فما
// كتأثرش بهاد الفحص.
function isEmailUnverified() {
    if (!window.currentUser) return false;
    const isPasswordAccount = window.currentUser.providerData.some(
        p => p.providerId === "password"
    );
    return isPasswordAccount && !window.currentUser.emailVerified;
}

function blockIfUnverified() {
    if (isEmailUnverified()) {
        const msg = "يرجى تفعيل بريدك الإلكتروني أولاً قبل حفظ أو تعديل البيانات.";
        if (window.customAlert) window.customAlert(msg);
        else alert(msg);
        return true;
    }
    return false;
}

// حماية: أي صفقة قديمة عندها resultR فاسد (NaN/undefined) كتبدل بـ 0
// (نفس الدالة موجودة فـ journal.js/model.js لتصحيح البيانات المحلية،
// وهنا كنستعملوها قبل الرفع لـ Firestore باش ما نرفعوش أرقام فاسدة)
function sanitizeTrades(arr) {
    if (!Array.isArray(arr)) return [];
    arr.forEach(t => {
        if (typeof t.resultR !== "number" || !isFinite(t.resultR)) {
            t.resultR = 0;
        }
    });
    return arr;
}

// يحفظ حقل واحد (modelsList / mistakesList) فـ وثيقة المستخدم الرئيسية.
// ما يخدمش إلا إذا كان المستخدم داخل.
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
        console.error("تعذر الحفظ السحابي (" + fieldName + "):", err);
    }
};

// معرّف فريد لكل صفقة، كيتسمى بيه الـ document ديالها فـ Firestore
window.generateTradeId = function () {
    if (window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }
    return "trade_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
};

// كل صفقة = وثيقة مستقلة فـ users/{uid}/trades/{tradeId}
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
        console.error("تعذر حفظ الصفقة فالسحابة:", err);
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
        console.error("تعذر حذف الصفقة من السحابة:", err);
    }
};

// رفع مجموعة صفقات دفعة وحدة (مستعملة فـ الاستيراد الجماعي والـ migration)
window.cloudBulkSaveTrades = async function (tradesArray) {
    if (!window.currentUser || !tradesArray || tradesArray.length === 0) return;
    sanitizeTrades(tradesArray);
    const uid = window.currentUser.uid;
    const chunkSize = 400; // حد Firestore للـ batch هو 500 عملية

    for (let i = 0; i < tradesArray.length; i += chunkSize) {
        const chunk = tradesArray.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach(t => {
            if (!t.id) t.id = window.generateTradeId();
            batch.set(doc(db, "users", uid, "trades", t.id), t);
        });
        await batch.commit();
    }
};

// كتمسح الكاش المحلي لكل بيانات المستخدم (trades/models/mistakes/tags/emotions)
// وكتبعث حدث باش journal.js/model.js يصفرو المتغيرات فالذاكرة.
// خاصها تتخدم عند logout وعند اكتشاف تبديل حساب (uid مختلف)، باش ما
// تبقاش بيانات حساب سابق بادية أو كتنخلط مع حساب جديد.
function clearLocalUserCache() {
    ["trades", "modelsList", "mistakesList", "tagsList", "emotionsList", "lastSyncedUid"]
        .forEach(k => localStorage.removeItem(k));
    window.dispatchEvent(new CustomEvent("cloudUserCleared"));
}

// كترجم أكواد أخطاء Firebase Auth لرسائل واضحة بالعربية للمستخدم
const AUTH_ERROR_MESSAGES = {
    "auth/email-already-in-use": "هاد البريد الإلكتروني مستعمل من قبل. جرب تسجيل الدخول.",
    "auth/invalid-email": "صيغة البريد الإلكتروني غير صحيحة.",
    "auth/weak-password": "كلمة المرور ضعيفة، خاصها تكون 6 حروف/أرقام على الأقل.",
    "auth/missing-password": "دخل كلمة المرور.",
    "auth/user-not-found": "ما كايناش حساب بهاد البريد الإلكتروني.",
    "auth/wrong-password": "كلمة المرور غير صحيحة.",
    "auth/invalid-credential": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    "auth/user-disabled": "هاد الحساب تم تعطيله.",
    "auth/too-many-requests": "محاولات كثيرة، حاول من بعد شوية.",
    "auth/network-request-failed": "تأكد من اتصالك بالإنترنت وحاول مرة أخرى."
};

function mapAuthError(err) {
    if (err && err.code && AUTH_ERROR_MESSAGES[err.code]) {
        return AUTH_ERROR_MESSAGES[err.code];
    }
    return "وقع خطأ، حاول مرة أخرى.";
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
            console.error("تعذر إرسال رسالة التحقق:", verifyErr);
            if (window.authDebugLog) window.authDebugLog("Email Verification", "error", { code: verifyErr.code, message: verifyErr.message, name: verifyErr.name });
        }
        return { ok: true };
    } catch (err) {
        console.error("خطأ إنشاء الحساب:", err);
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
        console.error("خطأ تسجيل الدخول بالبريد:", err);
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
        console.error("خطأ إعادة تعيين كلمة المرور:", err);
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
        const msg = "تم إرسال رسالة تحقق جديدة لبريدك الإلكتروني.";
        if (window.customAlert) window.customAlert(msg); else alert(msg);
    } catch (err) {
        console.error("تعذر إعادة إرسال رسالة التحقق:", err);
        if (window.authDebugLog) window.authDebugLog("Resend Verification", "error", { code: err.code, message: err.message, name: err.name });
        const msg = "تعذر إرسال الرسالة، حاول من بعد شوية.";
        if (window.customAlert) window.customAlert(msg); else alert(msg);
    }
};

async function loadTradesFromCloud(uid) {
    const snap = await getDocs(collection(db, "users", uid, "trades"));
    const result = [];
    snap.forEach(d => result.push(d.data()));
    return sanitizeTrades(result);
}

// هجرة لمرة وحدة: كنرفعو الصفقات المحلية (لي مازالت array قديم)
// لـ subcollection، ونعلمو migrationVersion باش ما تتكررش العملية.
async function migrateTradesIfNeeded(uid, userData) {
    if (userData.migrationVersion === 2) return;

    const localTradesRaw = localStorage.getItem("trades");
    const localTrades = sanitizeTrades(localTradesRaw ? JSON.parse(localTradesRaw) : []);

    if (localTrades.length > 0) {
        localTrades.forEach(t => {
            if (!t.id) t.id = window.generateTradeId();
        });
        await window.cloudBulkSaveTrades(localTrades);
        localStorage.setItem("trades", JSON.stringify(localTrades));
    }

    await setDoc(
        doc(db, "users", uid),
        { migrationVersion: 2 },
        { merge: true }
    );
}

// أول مرة يسجل فيها المستخدم دخول: كنديرو migration إذا لزم،
// وبعدها Firestore يصير هو المصدر الأساسي للصفقات.
async function syncUserData(user) {
    const uid = user.uid;
    const userRef = doc(db, "users", uid);
    const statusEl = document.getElementById("syncStatus");
    if (statusEl) statusEl.textContent = "جاري المزامنة...";

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

        if (data.migrationVersion === 2) {
            const cloudTrades = await loadTradesFromCloud(uid);
            localStorage.setItem("trades", JSON.stringify(cloudTrades));
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
            if (Object.keys(topLevelUpdate).length > 0) {
                await setDoc(userRef, topLevelUpdate, { merge: true });
            }
        }
    } catch (err) {
        console.error("تعذر مزامنة البيانات مع Firestore:", err);
        if (statusEl) statusEl.textContent = "تعذرت المزامنة";
        setTimeout(() => { if (statusEl) statusEl.textContent = ""; }, 3000);
        window.dispatchEvent(new CustomEvent("cloudDataReady"));
        return;
    }

    // نخبرو باقي السكريبتات فالصفحة باش تعاود تقرا البيانات وتحدث الواجهة
    window.dispatchEvent(new CustomEvent("cloudDataReady"));
    if (statusEl) statusEl.textContent = "";
}

// popup على Android/mobile browsers ماشي موثوق: Firebase Auth كيستعمل
// IndexedDB باش يبعث النتيجة من نافذة popup للصفحة الأصلية، وكي
// المتصفح (خصوصاً Chrome على Android) يعلق أو يخبي التبويب الأصلي
// (تبديل تطبيق، تدوير الشاشة، توفير طاقة...)، الاتصال بـ IndexedDB
// كيتقطع ويطلع خطأ عام بلا "code" واضح (مثال حقيقي: "Database is
// closing/hidden"، name="Error"، code=undefined). هاد النوع ديال
// الخطأ ما كانش كيتقبض من القائمة القديمة ديال الأكواد المعروفة
// (POPUP_FALLBACK_ERRORS)، فكانت كتبان "تسجيل الدخول تعذر" نهائياً
// بلا أي محاولة redirect.
//
// الحل (موصى بيه من Firebase نفسها لمتصفحات mobile/in-app):
// 1) على mobile/in-app browsers، نستعملو signInWithRedirect() مباشرة،
//    بلا ما نحاولو popup أصلاً — كيفاديها هاد المشكلة من جذورها.
// 2) على Desktop، نبقاو نجربو popup أولاً (تجربة أسرع/أفضل)، ولكن
//    fallback لـ redirect دابا كيتفعل مع أي خطأ (ماشي غير الأكواد
//    المعروفة)، لأن أخطاء popup على المتصفح ممكن توصل بلا "code" خالص.
function isMobileOrInAppBrowser() {
    const ua = navigator.userAgent || "";
    const isMobileUA = /Android|iPhone|iPad|iPod/i.test(ua);
    const isInApp = /FBAN|FBAV|Instagram|Line\/|MicroMessenger|wv\)/i.test(ua);
    return isMobileUA || isInApp;
}

window.loginWithGoogle = async function () {
    if (window.authDebugLog) window.authDebugLog("Google Login START", "info", { userAgent: navigator.userAgent });

    if (isMobileOrInAppBrowser()) {
        if (window.authDebugLog) window.authDebugLog("Google Login METHOD: redirect (mobile)", "info", {});
        try {
            if (window.authDebugLog) window.authDebugLog("Google Login REDIRECT STARTED", "info", {});
            await signInWithRedirect(auth, provider);
            // الصفحة غادي تنتقل لـ Google دابا، الكود لي تحت ما غاديش يخدم
        } catch (err) {
            if (window.authDebugLog) window.authDebugLog("Google Login ERROR", "error", { code: err && err.code, message: err && err.message, name: err && err.name, step: "redirect-initial" });
            console.error("خطأ تسجيل الدخول (redirect):", err);
            if (window.customAlert) window.customAlert("تعذر تسجيل الدخول، حاول مرة أخرى.");
            else alert("تعذر تسجيل الدخول، حاول مرة أخرى.");
        }
        return;
    }

    if (window.authDebugLog) window.authDebugLog("Google Login METHOD: popup", "info", {});
    try {
        await signInWithPopup(auth, provider);
        if (window.authDebugLog) window.authDebugLog("Google Login SUCCESS", "success", { step: "popup" });
    } catch (err) {
        // ماشي كل خطأ عندو "code" واضح (خصوصاً على mobile/in-app browsers
        // اللي دخلو عن طريق الخطأ لهنا)، فكنسجلو error.code/.message/.name
        // بلا شرط، وكنعتبرو أي فشل popup سبب كافي للـ fallback لـ redirect —
        // ماشي غير قائمة أكواد محددة مسبقاً
        if (window.authDebugLog) window.authDebugLog("Google Login POPUP ERROR", "error", { code: err && err.code, message: err && err.message, name: err && err.name });
        console.warn("تعذر تسجيل الدخول بـ popup، كنجربو redirect بدلها:", err);

        if (window.authDebugLog) window.authDebugLog("Google Login FALLBACK: redirect", "info", {});
        try {
            if (window.authDebugLog) window.authDebugLog("Google Login REDIRECT STARTED", "info", {});
            await signInWithRedirect(auth, provider);
            // الصفحة غادي تنتقل لـ Google دابا
        } catch (redirectErr) {
            if (window.authDebugLog) window.authDebugLog("Google Login ERROR", "error", { code: redirectErr && redirectErr.code, message: redirectErr && redirectErr.message, name: redirectErr && redirectErr.name, step: "redirect-fallback" });
            console.error("خطأ تسجيل الدخول (redirect):", redirectErr);
            if (window.customAlert) window.customAlert("تعذر تسجيل الدخول، حاول مرة أخرى.");
            else alert("تعذر تسجيل الدخول، حاول مرة أخرى.");
        }
    }
};

// كيتفحص هذا **فأول ما تتحمل الصفحة** (استدعاء على مستوى module،
// ماشي جوا دالة كتتفعل بالضغطة)، باش نلقطو نتيجة الرجوع من Google
// حتى لو المستخدم رجع للصفحة بعد redirect كامل (تحميل جديد للصفحة).
// ما كايناش أي retry أوتوماتيكي ديال signInWithPopup/signInWithRedirect
// هنا — غير قراءة النتيجة وتسجيلها، باش ما ندخلوش فـ loop.
if (window.authDebugLog) window.authDebugLog("Google Login REDIRECT RESULT", "info", { step: "checking on page load" });
getRedirectResult(auth).then((result) => {
    if (result && result.user) {
        if (window.authDebugLog) window.authDebugLog("Google Login SUCCESS", "success", { step: "redirect result", uid: result.user.uid });
    } else {
        // ماكاينش نتيجة redirect فـ انتظار (تحميل عادي للصفحة، ماشي رجوع
        // من Google) — هادشي طبيعي وماشي خطأ
        if (window.authDebugLog) window.authDebugLog("Google Login REDIRECT RESULT", "info", { result: "none pending" });
    }
}).catch((err) => {
    console.error("خطأ فـ نتيجة redirect:", err);
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
        userName.textContent = user.displayName || user.email || "مستخدم";

        const verifyBanner = document.getElementById("emailVerifyBanner");
        if (verifyBanner) {
            verifyBanner.style.display = isEmailUnverified() ? "flex" : "none";
        }

        // حماية إضافية: إذا آخر uid مزامَن مختلف عن المستخدم الحالي (تبديل
        // حساب بدون logout صريح)، نمسحو الكاش المحلي قبل ما نبداو المزامنة
        // باش ما تتخلطش بيانات الحساب القديم مع الجديد
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

// انقطاع الإنترنت: كنبينو حالة واضحة فـ syncStatus، وكنرجعوها كتفرغ
// أوتوماتيكياً كي يرجع الاتصال (المزامنة التالية غادي تتصايب من عندها)
window.addEventListener("offline", function () {
    const statusEl = document.getElementById("syncStatus");
    if (statusEl) statusEl.textContent = "غير متصل بالإنترنت";
});
window.addEventListener("online", function () {
    const statusEl = document.getElementById("syncStatus");
    if (statusEl && statusEl.textContent === "غير متصل بالإنترنت") {
        statusEl.textContent = "";
        if (window.currentUser) syncUserData(window.currentUser);
    }
});

// ===================================================================
// واجهة نافذة Email/Password (تسجيل دخول / إنشاء حساب / نسيان كلمة المرور)
// ===================================================================
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
    if (submitBtn) submitBtn.textContent = mode === "login" ? "تسجيل الدخول" : "إنشاء حساب";
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
        if (errEl) errEl.textContent = "عمر الحقول كاملين.";
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
        email = await window.customPrompt("دخل بريدك الإلكتروني باش نصيفطولك رابط إعادة التعيين:");
    }
    if (!email) return;

    const result = await window.sendPasswordReset(email);
    const msg = result.ok
        ? "تم إرسال رابط إعادة تعيين كلمة المرور لبريدك الإلكتروني."
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
