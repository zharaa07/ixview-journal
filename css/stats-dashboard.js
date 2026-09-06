// ===================================================================
// js/stats-dashboard.js
// "Performance Dashboard" — إعادة تصميم قسم الإحصائيات (V2)
// بناءً على برومت "IXVIEW JOURNAL - Professional Statistics Dashboard".
//
// مبدأ العمل: هاد الملف مستقل بالكامل (Self-contained)، ما كيبدلش أي
// دالة موجودة فـ journal.js. كيقرا مباشرة من المتغير العام `trades`
// (وباقي الدوال العامة زي getCheckedValues/refreshIcons) اللي كاينين
// فـ journal.js لأن السكريبتات الكلاسيكية (بلا type="module") كتشارك
// نفس الـ Global Scope.
//
// للتحديث التلقائي كي تتبدل الصفقات/الفلاتر، كنديرو "monkey-patch"
// خفيف على window.updateStats (دالة عامة كتتعيط من كل مكان فـ journal.js
// بعد Add/Edit/Delete/Import/Filter/Sync) — بلا ما نمس أي سطر فـ journal.js
// نفسها.
//
// الإعدادات (Trade Goal، Last N، Zones، Display Modes...) محفوظة فـ
// localStorage تحت مفتاح واحد، خاصة بهاد الجهاز (ماشي مرتبطة بـ Firestore
// حاليًا — يمكن تطويرها مستقبلاً لتتزامن عبر cloudSaveField بحال باقي
// القوائم).
// ===================================================================

(function () {

    const PD_SETTINGS_KEY = "pdDashboardSettings";

    // ---------------------------------------------------------------
    // الإعدادات: تحميل / حفظ
    // ---------------------------------------------------------------
    function pdDefaultSettings() {
        return {
            tradeGoal: 200,
            lastNCount: 100,
            winRate: {
                useLastN: false,
                includeBE: false,
                beCountsAs: "loss",
                displayMode: "bar",
                showPercentage: true
            },
            avgR: {
                useLastN: false,
                maxScale: 5,
                enableMiddleZone: false,
                middleZoneLimit: null
            },
            smallCards: {
                totalR: { useLastN: false },
                expectancy: { useLastN: false },
                profitFactor: { useLastN: false }
            },
            comparison: {
                model: "winrate",
                session: "winrate",
                asset: "winrate"
            },
            drawdown: {
                daily: "R",
                peakDaily: "R",
                max: "R",
                peakMax: "R"
            },
            valuePerR: null
        };
    }

    function pdLoadSettings() {
        let saved = {};
        try {
            saved = JSON.parse(localStorage.getItem(PD_SETTINGS_KEY)) || {};
        } catch (e) {
            saved = {};
        }
        const d = pdDefaultSettings();
        const merged = Object.assign({}, d, saved);
        merged.winRate = Object.assign({}, d.winRate, saved.winRate || {});
        merged.avgR = Object.assign({}, d.avgR, saved.avgR || {});
        merged.smallCards = {
            totalR: Object.assign({}, d.smallCards.totalR, (saved.smallCards && saved.smallCards.totalR) || {}),
            expectancy: Object.assign({}, d.smallCards.expectancy, (saved.smallCards && saved.smallCards.expectancy) || {}),
            profitFactor: Object.assign({}, d.smallCards.profitFactor, (saved.smallCards && saved.smallCards.profitFactor) || {})
        };
        merged.comparison = Object.assign({}, d.comparison, saved.comparison || {});
        merged.drawdown = Object.assign({}, d.drawdown, saved.drawdown || {});
        return merged;
    }

    let pdSettings = pdLoadSettings();

    function pdSaveSettings() {
        try {
            localStorage.setItem(PD_SETTINGS_KEY, JSON.stringify(pdSettings));
        } catch (e) {
            console.error("تعذر حفظ إعدادات Performance Dashboard:", e);
        }
    }

    // ---------------------------------------------------------------
    // Helpers عامة (قراءة البيانات من journal.js)
    // ---------------------------------------------------------------
    function pdSafeGetChecked(id) {
        return (typeof getCheckedValues === "function") ? getCheckedValues(id) : [];
    }

    function pdGetFilteredTrades() {
        if (typeof trades === "undefined" || !Array.isArray(trades)) return [];

        const selectedAsset = pdSafeGetChecked("assetFilterOptions");
        const modelFilterEl = document.getElementById("modelFilter");
        const selectedModel = modelFilterEl ? modelFilterEl.value : "All";
        const selectedSessions = pdSafeGetChecked("sessionFilterOptions");
        const selectedTags = pdSafeGetChecked("tagsFilterOptions");

        return trades.filter(function (trade) {
            if (selectedAsset.length > 0 && !selectedAsset.includes(trade.asset)) return false;
            if (selectedModel !== "All" && trade.model !== selectedModel) return false;
            if (selectedSessions.length > 0 && !selectedSessions.includes(trade.session)) return false;
            if (selectedTags.length > 0 && !(trade.tags && selectedTags.every(function (t) { return trade.tags && trade.tags.includes(t); }))) return false;
            return true;
        });
    }

    function pdSortedByDate(arr) {
        return arr.slice().sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
    }

    function pdTakeLastN(sortedArr, n) {
        if (!n || n <= 0) return sortedArr;
        return sortedArr.slice(-n);
    }

    function pdCounts(arr) {
        let wins = 0, losses = 0, be = 0, totalR = 0;
        arr.forEach(function (t) {
            if (t.result === "Win") wins++;
            else if (t.result === "Loss") losses++;
            else if (t.result === "Breakeven") be++;
            totalR += (t.resultR || 0);
        });
        return { wins: wins, losses: losses, be: be, totalR: totalR, count: arr.length };
    }

    function pdSyncSwitch(id, isOn) {
        const el = document.getElementById(id);
        if (el) el.classList.toggle("on", !!isOn);
    }

    function pdRefreshIcons() {
        if (typeof refreshIcons === "function") refreshIcons();
        else if (window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
    }

    // ---------------------------------------------------------------
    // SVG Gauges (Semicircle "Fuel Gauge" + Circular)
    // ---------------------------------------------------------------
    function pdPolarToCartesian(cx, cy, r, angleDeg) {
        const rad = (angleDeg - 90) * Math.PI / 180.0;
        return { x: cx + (r * Math.cos(rad)), y: cy + (r * Math.sin(rad)) };
    }

    // angleDeg: 0 = أعلى القوس، -90 = يسار، 90 = يمين (نصف دائرة علوي)
    function pdDescribeArc(cx, cy, r, startAngle, endAngle) {
        const start = pdPolarToCartesian(cx, cy, r, endAngle);
        const end = pdPolarToCartesian(cx, cy, r, startAngle);
        const largeArcFlag = (endAngle - startAngle) <= 180 ? "0" : "1";
        return ["M", start.x.toFixed(2), start.y.toFixed(2), "A", r, r, 0, largeArcFlag, 0, end.x.toFixed(2), end.y.toFixed(2)].join(" ");
    }

    function pdBuildSemicircleGauge(pct, color) {
        pct = Math.max(0, Math.min(1, pct || 0));
        const cx = 100, cy = 95, r = 78, strokeW = 14;
        const trackD = pdDescribeArc(cx, cy, r, -90, 90);
        const progAngleEnd = -90 + pct * 180;
        const progD = pct > 0.003 ? pdDescribeArc(cx, cy, r, -90, progAngleEnd) : "";
        const needleTip = pdPolarToCartesian(cx, cy, r - 8, progAngleEnd);

        return '<svg class="pd-gauge-svg" viewBox="0 0 200 112" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="' + trackD + '" fill="none" stroke="var(--bg-surface-2)" stroke-width="' + strokeW + '" stroke-linecap="round"/>' +
            (progD ? '<path d="' + progD + '" fill="none" stroke="' + color + '" stroke-width="' + strokeW + '" stroke-linecap="round"/>' : "") +
            '<line x1="' + cx + '" y1="' + cy + '" x2="' + needleTip.x.toFixed(1) + '" y2="' + needleTip.y.toFixed(1) + '" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
            '<circle cx="' + cx + '" cy="' + cy + '" r="6" fill="#fff"/>' +
            '</svg>';
    }

    function pdBuildCircularGauge(pctFraction, color) {
        pctFraction = Math.max(0, Math.min(1, pctFraction || 0));
        const r = 70, cx = 85, cy = 85;
        const circumference = 2 * Math.PI * r;
        const offset = circumference * (1 - pctFraction);
        return '<svg class="pd-circular-svg" viewBox="0 0 170 170">' +
            '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="var(--bg-surface-2)" stroke-width="14"/>' +
            '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="14" stroke-linecap="round" ' +
            'stroke-dasharray="' + circumference.toFixed(2) + '" stroke-dashoffset="' + offset.toFixed(2) + '"/>' +
            '</svg>';
    }

    // ---------------------------------------------------------------
    // CARD 1: Total Trades
    // ---------------------------------------------------------------
    function pdRenderTotalTrades(filteredSorted) {
        const container = document.getElementById("pdTotalTradesGauge");
        if (!container) return;

        const current = filteredSorted.length;
        const target = pdSettings.tradeGoal || 200;
        const pct = target > 0 ? current / target : 0;
        const overGoal = target > 0 && current >= target;
        const color = overGoal ? "var(--success)" : "var(--primary)";

        container.innerHTML =
            pdBuildSemicircleGauge(pct, color) +
            '<div class="pd-gauge-value"><span class="pd-big">' + current + '</span><span class="pd-slash">/</span><span style="font-size:18px;color:var(--text-tertiary);font-weight:600;">' + target + '</span></div>' +
            '<div class="pd-gauge-caption">' + (overGoal ? "🎯 تم تحقيق الهدف" : (Math.max(0, target - current) + " صفقة متبقية للهدف")) + '</div>';

        const input = document.getElementById("pdTradeGoalInput");
        if (input && document.activeElement !== input) input.value = target;
    }

    // ---------------------------------------------------------------
    // CARD 2: Win Rate
    // ---------------------------------------------------------------
    function pdRenderWinRate(filteredSorted) {
        const body = document.getElementById("pdWinRateBody");
        if (!body) return;

        const s = pdSettings.winRate;
        const set = s.useLastN ? pdTakeLastN(filteredSorted, pdSettings.lastNCount) : filteredSorted;
        const c = pdCounts(set);

        let sample, winRate;
        if (s.includeBE) {
            sample = c.wins + c.losses + c.be;
            winRate = sample ? ((s.beCountsAs === "win" ? (c.wins + c.be) : c.wins) / sample) * 100 : 0;
        } else {
            sample = c.wins + c.losses;
            winRate = sample ? (c.wins / sample) * 100 : 0;
        }

        const pctText = winRate.toFixed(1) + "%";
        const hiddenClass = s.showPercentage ? "" : "pd-value-hidden";

        if (s.displayMode === "circular") {
            body.innerHTML =
                '<div class="pd-circular-wrap ' + hiddenClass + '">' +
                pdBuildCircularGauge(winRate / 100, "var(--primary)") +
                '<div class="pd-circular-center"><span class="pd-big">' + pctText + '</span><span class="pd-caption">' + sample + ' Trades</span></div>' +
                '</div>';
        } else {
            body.innerHTML =
                '<div style="width:100%;" class="' + hiddenClass + '">' +
                '<div class="pd-progress-label"><span class="pd-big">' + pctText + '</span><span class="pd-caption">' + sample + ' Trades</span></div>' +
                '<div class="pd-progress-track"><div class="pd-progress-fill" style="width:' + Math.min(winRate, 100) + '%;"></div></div>' +
                '</div>';
        }

        pdSyncSwitch("pdWinRateLastNSwitch", s.useLastN);
        pdSyncSwitch("pdWinRateIncludeBESwitch", s.includeBE);
        pdSyncSwitch("pdWinRateShowPctSwitch", s.showPercentage);

        const beRow = document.getElementById("pdBeCountsAsRow");
        if (beRow) beRow.style.display = s.includeBE ? "block" : "none";
        const beSelect = document.getElementById("pdBeCountsAsSelect");
        if (beSelect) beSelect.value = s.beCountsAs;

        const lastNInput = document.getElementById("pdLastNCountInput");
        if (lastNInput && document.activeElement !== lastNInput) lastNInput.value = pdSettings.lastNCount;
    }

    // ---------------------------------------------------------------
    // CARD 3: Average R (Break-even RR + Performance Scale)
    // ---------------------------------------------------------------
    function pdRenderAvgR(filteredSorted) {
        const body = document.getElementById("pdAvgRBody");
        if (!body) return;

        const s = pdSettings.avgR;
        const set = s.useLastN ? pdTakeLastN(filteredSorted, pdSettings.lastNCount) : filteredSorted;

        const winners = set.filter(function (t) { return t.result === "Win"; });
        const losers = set.filter(function (t) { return t.result === "Loss"; });
        const totalWL = winners.length + losers.length;
        const winRateFrac = totalWL ? winners.length / totalWL : 0;
        const lossRateFrac = totalWL ? losers.length / totalWL : 0;

        const breakEvenRR = winRateFrac > 0 ? (lossRateFrac / winRateFrac) : null;
        const avgWinningRR = winners.length ? winners.reduce(function (sum, t) { return sum + (t.resultR || 0); }, 0) / winners.length : 0;

        const maxScale = s.maxScale || 5;
        const enableMiddle = !!s.enableMiddleZone;
        let middleLimit = s.middleZoneLimit;
        if (enableMiddle && (!middleLimit || breakEvenRR === null || middleLimit <= breakEvenRR)) {
            middleLimit = breakEvenRR !== null ? breakEvenRR * 1.4 : maxScale * 0.4;
        }

        const beClamped = breakEvenRR === null ? maxScale : Math.min(breakEvenRR, maxScale);
        const redPct = Math.max(0, Math.min(100, (beClamped / maxScale) * 100));
        let orangePct = 0, greenPct = 100 - redPct;
        if (enableMiddle && middleLimit !== null) {
            const midClamped = Math.min(Math.max(middleLimit, beClamped), maxScale);
            orangePct = Math.max(0, Math.min(100 - redPct, ((midClamped - beClamped) / maxScale) * 100));
            greenPct = Math.max(0, 100 - redPct - orangePct);
        }

        const markerVal = Math.max(0, Math.min(avgWinningRR, maxScale));
        const markerLeftPct = (markerVal / maxScale) * 100;

        let status = "-", statusClass = "";
        if (breakEvenRR !== null) {
            if (avgWinningRR < breakEvenRR) { status = "Losing"; statusClass = "pd-status-losing"; }
            else if (enableMiddle && middleLimit !== null && avgWinningRR < middleLimit) { status = "Average"; statusClass = "pd-status-average"; }
            else { status = "Profitable"; statusClass = "pd-status-profitable"; }
        }
        const statusColorVar = statusClass === "pd-status-losing" ? "var(--danger)" : statusClass === "pd-status-average" ? "var(--warning)" : statusClass === "pd-status-profitable" ? "var(--success)" : "var(--text-primary)";

        body.innerHTML =
            '<div class="pd-avgr-top"><span class="pd-big" style="color:' + statusColorVar + ';">' + avgWinningRR.toFixed(2) + 'R</span><span class="pd-caption">Average Winning RR</span></div>' +
            '<div class="pd-scale-wrap">' +
            '<div class="pd-scale-marker" style="left:' + markerLeftPct.toFixed(2) + '%;" data-val="' + avgWinningRR.toFixed(2) + 'R"></div>' +
            '<div class="pd-scale-bar">' +
            '<div class="pd-scale-seg-red" style="flex:0 0 ' + redPct.toFixed(2) + '%;"></div>' +
            (enableMiddle ? '<div class="pd-scale-seg-orange" style="flex:0 0 ' + orangePct.toFixed(2) + '%;"></div>' : "") +
            '<div class="pd-scale-seg-green" style="flex:0 0 ' + greenPct.toFixed(2) + '%;"></div>' +
            '</div>' +
            '<div class="pd-scale-ticks"><span>0</span><span>' + (breakEvenRR !== null ? breakEvenRR.toFixed(2) + "R" : "-") + '</span>' +
            (enableMiddle && middleLimit !== null ? '<span>' + middleLimit.toFixed(2) + 'R</span>' : "") +
            '<span>' + maxScale + 'R</span></div>' +
            '</div>' +
            '<div class="pd-avgr-footer">' +
            '<div><div class="pd-mini-label">Break-even RR</div><div class="pd-mini-value">' + (breakEvenRR !== null ? breakEvenRR.toFixed(2) + "R" : "-") + '</div></div>' +
            '<div><div class="pd-mini-label">Average RR</div><div class="pd-mini-value">' + avgWinningRR.toFixed(2) + 'R</div></div>' +
            '<div><div class="pd-mini-label">Status</div><div class="pd-mini-value ' + statusClass + '">' + status + '</div></div>' +
            '</div>';

        pdSyncSwitch("pdAvgRLastNSwitch", s.useLastN);
        pdSyncSwitch("pdAvgRMiddleZoneSwitch", enableMiddle);
        const midRow = document.getElementById("pdMiddleZoneLimitRow");
        if (midRow) midRow.style.display = enableMiddle ? "block" : "none";
        const midInput = document.getElementById("pdMiddleZoneLimitInput");
        if (midInput && document.activeElement !== midInput && s.middleZoneLimit) midInput.value = s.middleZoneLimit;
    }

    // ---------------------------------------------------------------
    // SECTION 2: Small Performance Cards
    // ---------------------------------------------------------------
    function pdRenderSmallCards(filteredSorted) {
        const grid = document.getElementById("pdSmallCardsGrid");
        if (!grid) return;

        const sc = pdSettings.smallCards;

        function getSet(useLastN) {
            return useLastN ? pdTakeLastN(filteredSorted, pdSettings.lastNCount) : filteredSorted;
        }

        const totalRSet = getSet(sc.totalR.useLastN);
        const totalR = totalRSet.reduce(function (s, t) { return s + (t.resultR || 0); }, 0);

        const expSet = getSet(sc.expectancy.useLastN);
        const expectancy = expSet.length ? expSet.reduce(function (s, t) { return s + (t.resultR || 0); }, 0) / expSet.length : 0;

        const pfSet = getSet(sc.profitFactor.useLastN);
        const grossProfit = pfSet.filter(function (t) { return t.resultR > 0; }).reduce(function (s, t) { return s + t.resultR; }, 0);
        const grossLoss = Math.abs(pfSet.filter(function (t) { return t.resultR < 0; }).reduce(function (s, t) { return s + t.resultR; }, 0));
        const profitFactor = grossLoss ? (grossProfit / grossLoss) : (grossProfit > 0 ? Infinity : 0);

        const cFull = pdCounts(filteredSorted);

        const cards = [
            { key: "totalR", label: "Total R", value: totalR.toFixed(1) + "R", toggle: true, on: sc.totalR.useLastN },
            { key: "expectancy", label: "Expectancy", value: expectancy.toFixed(2) + "R", toggle: true, on: sc.expectancy.useLastN },
            { key: "profitFactor", label: "Profit Factor", value: (profitFactor === Infinity ? "∞" : profitFactor.toFixed(2)), toggle: true, on: sc.profitFactor.useLastN },
            { key: "wins", label: "Total Wins", value: cFull.wins, toggle: false },
            { key: "losses", label: "Total Losses", value: cFull.losses, toggle: false },
            { key: "be", label: "Total Breakeven", value: cFull.be, toggle: false }
        ];

        grid.innerHTML = cards.map(function (c) {
            return '<div class="pd-card pd-small-card">' +
                '<div class="pd-card-head">' +
                '<span class="pd-card-title">' + c.label + '</span>' +
                (c.toggle ? '<button type="button" class="pd-small-toggle-btn ' + (c.on ? "active" : "") + '" title="Last ' + pdSettings.lastNCount + ' Trades" onclick="PD.toggleSmallCard(\'' + c.key + '\')">N</button>' : "") +
                '</div>' +
                '<div class="pd-small-value">' + c.value + '</div>' +
                '</div>';
        }).join("");
    }

    // ---------------------------------------------------------------
    // SECTION 3: Comparison Cards (Best vs Worst)
    // ---------------------------------------------------------------
    function pdGroupBy(arr, keyFn) {
        const map = {};
        arr.forEach(function (t) {
            const k = keyFn(t);
            if (!k) return;
            if (!map[k]) map[k] = [];
            map[k].push(t);
        });
        return map;
    }

    function pdGroupMetric(groupArr, metric) {
        const c = pdCounts(groupArr);
        const totalWL = c.wins + c.losses;
        const winRate = totalWL ? (c.wins / totalWL) * 100 : 0;
        const avgRR = groupArr.length ? groupArr.reduce(function (s, t) { return s + (t.resultR || 0); }, 0) / groupArr.length : 0;
        return metric === "winrate" ? winRate : avgRR;
    }

    function pdRenderComparisonCard(containerId, filteredSorted, keyFn, metricKey) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const groups = pdGroupBy(filteredSorted, keyFn);
        const names = Object.keys(groups);

        if (names.length === 0) {
            container.innerHTML = '<p style="font-size:12px;color:var(--text-tertiary);text-align:center;padding:20px 0;">لا توجد بيانات كافية بعد</p>';
            return;
        }

        const scored = names.map(function (name) {
            return { name: name, count: groups[name].length, value: pdGroupMetric(groups[name], metricKey) };
        });
        scored.sort(function (a, b) { return b.value - a.value; });

        const best = scored[0];
        const worst = scored[scored.length - 1];
        const isRR = metricKey === "avgrr";
        function fmt(v) { return isRR ? ((v >= 0 ? "+" : "") + v.toFixed(2) + "R") : (v.toFixed(1) + "%"); }

        container.innerHTML =
            '<div class="pd-vs-body">' +
            '<div class="pd-vs-half pd-vs-best"><span class="pd-vs-tag pd-vs-tag-best">Best</span><span class="pd-vs-name">' + best.name + '</span><span class="pd-vs-value">' + fmt(best.value) + '</span><span class="pd-vs-sub">' + best.count + ' Trades</span></div>' +
            '<div class="pd-vs-half pd-vs-worst"><span class="pd-vs-tag pd-vs-tag-worst">Worst</span><span class="pd-vs-name">' + worst.name + '</span><span class="pd-vs-value">' + fmt(worst.value) + '</span><span class="pd-vs-sub">' + worst.count + ' Trades</span></div>' +
            '</div>';
    }

    function pdRenderComparisons(filteredSorted) {
        pdRenderComparisonCard("pdCompareModel", filteredSorted, function (t) { return t.model; }, pdSettings.comparison.model);
        pdRenderComparisonCard("pdCompareSession", filteredSorted, function (t) { return t.session; }, pdSettings.comparison.session);
        pdRenderComparisonCard("pdCompareAsset", filteredSorted, function (t) { return t.asset; }, pdSettings.comparison.asset);

        const modelSel = document.getElementById("pdModelMetricSelect");
        if (modelSel) modelSel.value = pdSettings.comparison.model;
        const sessionSel = document.getElementById("pdSessionMetricSelect");
        if (sessionSel) sessionSel.value = pdSettings.comparison.session;
        const assetSel = document.getElementById("pdAssetMetricSelect");
        if (assetSel) assetSel.value = pdSettings.comparison.asset;
    }

    // ---------------------------------------------------------------
    // SECTION 4: Drawdown Cards
    // ---------------------------------------------------------------
    function pdComputeDayLocalDD(dayTrades) {
        let equity = 0, peak = 0, worstDD = 0, peakAtWorst = 0;
        dayTrades.forEach(function (t) {
            equity += (t.resultR || 0);
            if (equity > peak) peak = equity;
            const dd = peak - equity;
            if (dd > worstDD) { worstDD = dd; peakAtWorst = peak; }
        });
        return { dd: worstDD, peakAtDD: peakAtWorst };
    }

    function pdComputeDrawdowns(filteredSorted) {
        const byDay = {};
        filteredSorted.forEach(function (t) {
            const day = (t.date || "").slice(0, 10);
            if (!day) return;
            if (!byDay[day]) byDay[day] = [];
            byDay[day].push(t);
        });

        const todayKey = new Date().toISOString().slice(0, 10);
        const todayResult = pdComputeDayLocalDD(byDay[todayKey] || []);

        let worstDailyDD = 0, worstDailyPeak = 0;
        Object.keys(byDay).forEach(function (day) {
            const r = pdComputeDayLocalDD(byDay[day]);
            if (r.dd > worstDailyDD) { worstDailyDD = r.dd; worstDailyPeak = r.peakAtDD; }
        });

        let equity = 0, peak = 0, worstDD = 0, peakAtWorstDD = 0;
        filteredSorted.forEach(function (t) {
            equity += (t.resultR || 0);
            if (equity > peak) peak = equity;
            const dd = peak - equity;
            if (dd > worstDD) { worstDD = dd; peakAtWorstDD = peak; }
        });

        return {
            daily: { value: todayResult.dd, peak: todayResult.peakAtDD },
            peakDaily: { value: worstDailyDD, peak: worstDailyPeak },
            max: { value: (peak - equity), peak: peak },
            peakMax: { value: worstDD, peak: peakAtWorstDD }
        };
    }

    function pdFormatDrawdownValue(entry, mode) {
        const value = entry.value, peak = entry.peak;
        if (mode === "%") {
            if (!peak || peak <= 0) return "0%";
            return ((value / peak) * 100).toFixed(1) + "%";
        }
        if (mode === "$") {
            if (!pdSettings.valuePerR) return "—";
            return "$" + (value * pdSettings.valuePerR).toFixed(0);
        }
        return value.toFixed(2) + "R";
    }

    function pdRenderDrawdownCards(filteredSorted) {
        const grid = document.getElementById("pdDrawdownGrid");
        if (!grid) return;

        const dd = pdComputeDrawdowns(filteredSorted);
        const cards = [
            { key: "daily", label: "Daily Drawdown", entry: dd.daily },
            { key: "peakDaily", label: "Peak Daily Drawdown", entry: dd.peakDaily },
            { key: "max", label: "Max Drawdown", entry: dd.max },
            { key: "peakMax", label: "Peak Max Drawdown", entry: dd.peakMax }
        ];

        grid.innerHTML = cards.map(function (c) {
            const mode = pdSettings.drawdown[c.key] || "R";
            return '<div class="pd-card pd-drawdown-card">' +
                '<div class="pd-card-head">' +
                '<span class="pd-card-title">' + c.label + '</span>' +
                '<button type="button" class="pd-icon-btn" title="Eye (قريبًا)"><i data-lucide="eye"></i></button>' +
                '</div>' +
                '<div class="pd-drawdown-value">' + pdFormatDrawdownValue(c.entry, mode) + '</div>' +
                '<select class="pd-mode-select" onchange="PD.updateDrawdownMode(\'' + c.key + '\', this.value)">' +
                '<option value="R"' + (mode === "R" ? " selected" : "") + '>R</option>' +
                '<option value="%"' + (mode === "%" ? " selected" : "") + '>%</option>' +
                '<option value="$"' + (mode === "$" ? " selected" : "") + '>$</option>' +
                '</select>' +
                '</div>';
        }).join("");

        pdRefreshIcons();
    }

    // ---------------------------------------------------------------
    // الدالة الرئيسية: كتبني كل أقسام Performance Dashboard
    // ---------------------------------------------------------------
    function renderStatsDashboard() {
        if (!document.getElementById("performanceDashboard")) return;

        const filtered = pdGetFilteredTrades();
        const sorted = pdSortedByDate(filtered);

        pdRenderTotalTrades(sorted);
        pdRenderWinRate(sorted);
        pdRenderAvgR(sorted);
        pdRenderSmallCards(sorted);
        pdRenderComparisons(sorted);
        pdRenderDrawdownCards(sorted);

        pdRefreshIcons();
    }

    // ---------------------------------------------------------------
    // واجهة PD.* المستعملة من الـ onclick/onchange فـ الـ HTML
    // ---------------------------------------------------------------
    window.PD = {

        togglePopover: function (anchorId) {
            const anchor = document.getElementById(anchorId);
            if (!anchor) return;
            const popover = anchor.querySelector(".pd-popover");
            if (!popover) return;
            const willOpen = !popover.classList.contains("open");
            document.querySelectorAll(".pd-popover.open").forEach(function (p) { p.classList.remove("open"); });
            if (willOpen) popover.classList.add("open");
        },

        toggleSwitch: function (cardKey, propName) {
            if (!pdSettings[cardKey]) return;
            pdSettings[cardKey][propName] = !pdSettings[cardKey][propName];
            pdSaveSettings();
            renderStatsDashboard();
        },

        updateWinRateSetting: function (prop, value) {
            pdSettings.winRate[prop] = value;
            pdSaveSettings();
            renderStatsDashboard();
        },

        updateAvgRSetting: function (prop, value) {
            pdSettings.avgR[prop] = value;
            pdSaveSettings();
            renderStatsDashboard();
        },

        updateTradeGoal: function (val) {
            const n = parseInt(val, 10);
            pdSettings.tradeGoal = (isFinite(n) && n > 0) ? n : 200;
            pdSaveSettings();
            renderStatsDashboard();
        },

        updateLastNCount: function (val) {
            const n = parseInt(val, 10);
            pdSettings.lastNCount = (isFinite(n) && n > 0) ? n : 100;
            pdSaveSettings();
            renderStatsDashboard();
        },

        updateComparisonMetric: function (kind, val) {
            pdSettings.comparison[kind] = val;
            pdSaveSettings();
            renderStatsDashboard();
        },

        toggleSmallCard: function (key) {
            if (!pdSettings.smallCards[key]) return;
            pdSettings.smallCards[key].useLastN = !pdSettings.smallCards[key].useLastN;
            pdSaveSettings();
            renderStatsDashboard();
        },

        updateDrawdownMode: function (key, mode) {
            if (mode === "$" && !pdSettings.valuePerR) {
                if (window.customPrompt) {
                    window.customPrompt("أدخل قيمة الـ 1R بالدولار (تقديري) باش يتحسب مبلغ الـ Drawdown:").then(function (v) {
                        const num = parseFloat(v);
                        if (num && num > 0) pdSettings.valuePerR = num;
                        pdSettings.drawdown[key] = mode;
                        pdSaveSettings();
                        renderStatsDashboard();
                    });
                    return;
                } else {
                    const v = prompt("أدخل قيمة الـ 1R بالدولار (تقديري):");
                    const num = parseFloat(v);
                    if (num && num > 0) pdSettings.valuePerR = num;
                }
            }
            pdSettings.drawdown[key] = mode;
            pdSaveSettings();
            renderStatsDashboard();
        }

    };

    window.renderStatsDashboard = renderStatsDashboard;

    // ---------------------------------------------------------------
    // إغلاق أي Popover مفتوح كي نضغطو برا منه
    // ---------------------------------------------------------------
    document.addEventListener("click", function (e) {
        if (!e.target.closest(".pd-popover-anchor")) {
            document.querySelectorAll(".pd-popover.open").forEach(function (p) { p.classList.remove("open"); });
        }
    });

    // ---------------------------------------------------------------
    // Hook خفيف على window.updateStats (بلا ما نمس journal.js)
    // كل استدعاء لـ updateStats() (بعد Add/Edit/Delete/Import/Filter/Sync)
    // غادي يعاود يرسم Performance Dashboard تلقائيًا.
    // ---------------------------------------------------------------
    const _pdOrigUpdateStats = window.updateStats;
    if (typeof _pdOrigUpdateStats === "function") {
        window.updateStats = function () {
            _pdOrigUpdateStats.apply(this, arguments);
            try { renderStatsDashboard(); } catch (e) { console.error("PD render error:", e); }
        };
    }

    window.addEventListener("themeChanged", function () {
        try { renderStatsDashboard(); } catch (e) { /* لا شيء */ }
    });

    function pdInitialRender() {
        try { renderStatsDashboard(); } catch (e) { console.error("PD initial render error:", e); }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", pdInitialRender);
    } else {
        pdInitialRender();
    }

})();
