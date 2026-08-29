// ===================================================================
// js/emotions-mistakes-data.js
// القوائم الثابتة (System / Default) لـ Emotions و Mistakes.
// مصدر الحقيقة الوحيد لهاد القوائم — معرّف على مستوى التطبيق (كود)،
// ماشي فـ Firestore ولا localStorage، باش:
//   - يبقى موجود ديمًا بلا ما يعتمد على صفقة سابقة أو اختيار المستخدم
//   - ما يتكررش/يتخزنش فـ حساب أي مستخدم
//   - يبقى نفسه لكل المستخدمين، وقابل للتوسع من مكان وحيد
//
// القوائم "المخصصة" (Custom) لي كيضيفها المستخدم كتبقى فـ
// mistakesList / emotionsList (localStorage + Firestore) بحالها، بلا تغيير.
// ===================================================================

const SYSTEM_EMOTIONS = [
    "استعجال", "طمع", "خوف", "تردد", "ثقة", "ثقة زائدة",
    "توتر", "هدوء", "ملل", "FOMO", "انتقام", "إحباط",
    "غضب", "قلق", "حماس زائد", "عدم تركيز", "تعب", "نعاس",
    "ضغط", "شك", "ارتباك", "صبر", "انضباط", "محايد"
];

const SYSTEM_MISTAKES_CATEGORIES = [
    { key: "entry", label: "Entry Mistakes", items: [
        "دخول مبكر", "دخول متأخر", "دخول بدون تأكيد", "مطاردة السعر",
        "دخول بسبب FOMO", "دخول عشوائي", "دخول خارج الـ Model", "دخول من مكان سيئ"
    ]},
    { key: "management", label: "Trade Management Mistakes", items: [
        "تحريك الستوب بدون سبب", "توسيع الستوب", "إغلاق مبكر", "تأخير الخروج",
        "عدم أخذ Partial", "عدم تأمين الصفقة", "تغيير TP عشوائياً",
        "تغيير SL عشوائياً", "الخروج بسبب الخوف", "الخروج بسبب الطمع"
    ]},
    { key: "risk", label: "Risk Management Mistakes", items: [
        "مخاطرة أعلى من الخطة", "Lot أكبر من المسموح", "Stop أكبر من المخطط",
        "Overtrading", "Revenge Trade", "مضاعفة بعد خسارة", "تجاوز Daily Loss"
    ]},
    { key: "analysis", label: "Analysis Mistakes", items: [
        "تحليل خاطئ", "تجاهل الـ HTF", "تجاهل الـ Bias", "تجاهل السيولة",
        "تجاهل الأخبار", "تجاهل Session", "تجاهل شرط من شروط الـ Model",
        "قراءة خاطئة للـ Structure", "دخول من منطقة غير صالحة"
    ]},
    { key: "discipline", label: "Discipline Mistakes", items: [
        "تداول خارج الوقت المحدد", "تداول خارج الخطة", "أخذ صفقة Low Quality",
        "عدم انتظار الـ Setup", "إعادة الدخول بدون سبب", "مخالفة قاعدة"
    ]}
];

// نسخة مسطحة (flat) لأي مكان محتاج غير أسماء بلا تصنيف
const SYSTEM_MISTAKES = SYSTEM_MISTAKES_CATEGORIES.reduce(
    (all, cat) => all.concat(cat.items), []
);

// ------------------------- Helpers (قراءة فقط) -------------------------

function isSystemEmotion(name) {
    return SYSTEM_EMOTIONS.includes(name);
}

function isSystemMistake(name) {
    return SYSTEM_MISTAKES.includes(name);
}

// كيرجع غير الجزء "المخصص" الحقيقي (كيستثني أي تطابق مع System باش
// ما يبانش نفس الاسم مرتين فـ الواجهة)
function getMergedEmotionsCustom(customList) {
    return (customList || []).filter(e => !SYSTEM_EMOTIONS.includes(e));
}
function getMergedMistakesCustom(customList) {
    return (customList || []).filter(m => !SYSTEM_MISTAKES.includes(m));
}

function escapeAttr(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// كتزيد checkbox لأي قيمة موجودة فـ صفقة (trade) بصح تمسحات من القائمة
// (System أو Custom) — باش الصفقات القديمة ما تضيعش بياناتها عند
// التعديل والحفظ (نقطة 5 فالطلب). إذا القيمة كاينة فـ الـ DOM من قبل،
// غير كنعلموها checked.
function ensureOrphanOptions(containerId, values) {
    const container = document.getElementById(containerId);
    if (!container || !values || !values.length) return;

    const existingBoxes = Array.from(container.querySelectorAll('input[type="checkbox"]'));

    values.forEach(value => {
        if (!value) return;
        const box = existingBoxes.find(b => b.value === value);
        if (box) {
            box.checked = true;
            return;
        }
        const label = document.createElement("label");
        label.innerHTML =
            '<input type="checkbox" value="' + escapeAttr(value) + '" checked> ' +
            escapeAttr(value) +
            ' <span style="color:var(--text-tertiary);font-size:11px;">(محذوف من القائمة)</span>';
        container.appendChild(label);
    });
}

// كتفرغ كل الاختيارات فـ dropdown معين (زر Clear، نقطة 7)
function clearMultiSelect(containerId, labelId, chipsId, placeholder) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('input[type="checkbox"]:checked').forEach(box => box.checked = false);
    if (typeof updateMultiSelectUI === "function") {
        updateMultiSelectUI(containerId, labelId, chipsId, placeholder);
    }
}

window.SYSTEM_EMOTIONS = SYSTEM_EMOTIONS;
window.SYSTEM_MISTAKES_CATEGORIES = SYSTEM_MISTAKES_CATEGORIES;
window.SYSTEM_MISTAKES = SYSTEM_MISTAKES;
window.isSystemEmotion = isSystemEmotion;
window.isSystemMistake = isSystemMistake;
window.getMergedEmotionsCustom = getMergedEmotionsCustom;
window.getMergedMistakesCustom = getMergedMistakesCustom;
window.escapeAttr = escapeAttr;
window.ensureOrphanOptions = ensureOrphanOptions;
window.clearMultiSelect = clearMultiSelect;
