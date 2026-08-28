// ===================================================================
// js/theme.js
// تبديل Light Mode / Dark Mode + حفظ اختيار المستخدم.
// كيخدم بـ CSS variable وحدة على <html data-theme="dark|light">،
// وكل الألوان فـ css/tokens.css كتتبدل تلقائيًا حسب هاد الـ attribute.
// ===================================================================

(function () {
    const STORAGE_KEY = "ixview-theme";

    function getSavedTheme() {
        return localStorage.getItem(STORAGE_KEY);
    }

    function getPreferredTheme() {
        const saved = getSavedTheme();
        if (saved === "light" || saved === "dark") return saved;
        // إذا ما اختارش المستخدم شي حاجة، نتبعو تفضيل النظام
        return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        const toggle = document.getElementById("themeToggle");
        if (toggle) {
            toggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
            toggle.setAttribute("title", theme === "dark" ? "التبديل لـ Light Mode" : "التبديل لـ Dark Mode");
        }
        const icon = document.getElementById("themeIcon");
        if (icon) {
            icon.setAttribute("data-lucide", theme === "dark" ? "sun" : "moon");
            if (window.lucide && typeof window.lucide.createIcons === "function") {
                window.lucide.createIcons();
            }
        }
    }

    // نطبقو الثيم أول حاجة (قبل ما يترسم باقي الصفحة) باش ما يبانش "فلاش" أبيض
    applyTheme(getPreferredTheme());

    window.toggleTheme = function () {
        const current = document.documentElement.getAttribute("data-theme");
        const next = current === "dark" ? "light" : "dark";
        localStorage.setItem(STORAGE_KEY, next);
        applyTheme(next);
        // كنخبرو باقي السكريبتات (الرسوم البيانية) باش تعاود ترسم بألوان الثيم الجديد
        window.dispatchEvent(new CustomEvent("themeChanged", { detail: { theme: next } }));
    };

    document.addEventListener("DOMContentLoaded", function () {
        applyTheme(getPreferredTheme());
    });
})();
