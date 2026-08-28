// ===================================================================
// js/custom-dialog.js
// كيبدل alert() / confirm() / prompt() الأصليين ديال المتصفح (لي
// كيبانو بشكل رمادي بدائي بلا Dark Mode) بنافذة احترافية متناسقة مع
// تصميم الموقع. كل الدوال async وكترجع Promise، وكيتبنى الـ DOM
// ديالها مرة وحدة فأول استعمال.
// ===================================================================

(function () {

    let overlay = null;
    let box = null;
    let msgEl = null;
    let inputEl = null;
    let okBtn = null;
    let cancelBtn = null;

    function ensureBuilt() {
        if (overlay) return;

        overlay = document.createElement("div");
        overlay.className = "modal-overlay custom-dialog-overlay";

        box = document.createElement("div");
        box.className = "modal-box custom-dialog-box";

        msgEl = document.createElement("div");
        msgEl.className = "custom-dialog-message";

        inputEl = document.createElement("input");
        inputEl.type = "text";
        inputEl.className = "custom-dialog-input";

        const actions = document.createElement("div");
        actions.className = "custom-dialog-actions";

        cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "btn btn-secondary";
        cancelBtn.textContent = "إلغاء";

        okBtn = document.createElement("button");
        okBtn.type = "button";
        okBtn.className = "btn btn-primary";
        okBtn.textContent = "حسنًا";

        actions.appendChild(cancelBtn);
        actions.appendChild(okBtn);

        box.appendChild(msgEl);
        box.appendChild(inputEl);
        box.appendChild(actions);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }

    function open(options) {
        ensureBuilt();

        msgEl.textContent = options.message || "";
        inputEl.style.display = options.showInput ? "block" : "none";
        inputEl.value = options.defaultValue || "";
        cancelBtn.style.display = options.showCancel ? "inline-flex" : "none";
        okBtn.textContent = options.okText || "حسنًا";
        cancelBtn.textContent = options.cancelText || "إلغاء";

        overlay.style.display = "flex";

        if (options.showInput) {
            setTimeout(function () { inputEl.focus(); }, 50);
        }

        return new Promise(function (resolve) {

            function cleanup(result) {
                overlay.style.display = "none";
                okBtn.onclick = null;
                cancelBtn.onclick = null;
                inputEl.onkeydown = null;
                resolve(result);
            }

            okBtn.onclick = function () {
                cleanup(options.showInput ? inputEl.value.trim() : true);
            };

            cancelBtn.onclick = function () {
                cleanup(options.showInput ? null : false);
            };

            if (options.showInput) {
                inputEl.onkeydown = function (e) {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        cleanup(inputEl.value.trim());
                    }
                    if (e.key === "Escape") {
                        cleanup(null);
                    }
                };
            }
        });
    }

    // بديل alert() — كتبين رسالة وزر "حسنًا" وحيد
    window.customAlert = function (message) {
        return open({ message: message, showInput: false, showCancel: false });
    };

    // بديل confirm() — كترجع true/false
    window.customConfirm = function (message) {
        return open({ message: message, showInput: false, showCancel: true });
    };

    // بديل prompt() — كترجع النص المدخل أو null إذا الغى المستخدم
    window.customPrompt = function (message, defaultValue) {
        return open({ message: message, showInput: true, showCancel: true, defaultValue: defaultValue });
    };

    // تقرير احترافي بعد الاستيراد (نقاط: كم تزاد، كم تجوهل...)
    // summary = { tradesAdded, tradesSkipped, modelsAdded, tagsAdded, mistakesAdded, emotionsAdded, errors }
    window.showImportSummary = function (summary) {
        ensureBuilt();

        const lines = [];
        lines.push(summary.tradesAdded + " Trades Added");
        if (summary.tradesSkipped > 0) lines.push(summary.tradesSkipped + " Duplicate Trades Skipped");
        if (summary.modelsAdded > 0) lines.push(summary.modelsAdded + " Models Added");
        if (summary.tagsAdded > 0) lines.push(summary.tagsAdded + " Tags Added");
        if (summary.mistakesAdded > 0) lines.push(summary.mistakesAdded + " Mistakes Added");
        if (summary.emotionsAdded > 0) lines.push(summary.emotionsAdded + " Emotions Added");
        if (summary.errors > 0) lines.push(summary.errors + " Errors");

        msgEl.innerHTML =
            '<strong style="color:var(--primary);font-size:16px;">Imported Successfully</strong>' +
            '<ul class="custom-dialog-list">' +
            lines.map(function (l) { return "<li>" + l + "</li>"; }).join("") +
            "</ul>";

        inputEl.style.display = "none";
        cancelBtn.style.display = "none";
        okBtn.textContent = "حسنًا";
        overlay.style.display = "flex";

        return new Promise(function (resolve) {
            okBtn.onclick = function () {
                overlay.style.display = "none";
                okBtn.onclick = null;
                resolve(true);
            };
        });
    };

})();
