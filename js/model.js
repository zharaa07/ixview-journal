

// كل مرة كنزيدو HTML فيه data-lucide (أزرار، أيقونات...) خاصنا نستدعيو
// هاد الدالة باش Lucide يرسمها كـ SVG. ما تخدمش والو إذا المكتبة ما تحملاتش بعد.
function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
    }
}

// ===================================================================
// App Header v2 — Hamburger Menu + Navigation Tabs
// ===================================================================
function toggleHeaderMenu() {
    const panel = document.getElementById("headerMenuPanel");
    const overlay = document.getElementById("headerMenuOverlay");
    const btn = document.getElementById("headerHamburgerBtn");
    if (!panel) return;
    const opening = !panel.classList.contains("open");
    panel.classList.toggle("open", opening);
    if (overlay) overlay.classList.toggle("open", opening);
    if (btn) btn.setAttribute("aria-expanded", opening ? "true" : "false");
}

function closeHeaderMenu() {
    const panel = document.getElementById("headerMenuPanel");
    const overlay = document.getElementById("headerMenuOverlay");
    const btn = document.getElementById("headerHamburgerBtn");
    if (panel) panel.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
    if (btn) btn.setAttribute("aria-expanded", "false");
}

// model.html: "Journal" و"Models" كيوديو لـ Journal.html (هوما عايشين
// تما)، "Analytics" كتبقى Scroll محلي لأن هاد الصفحة عندها القسم ديالها.
function headerNavigate(target) {
    if (target === "journal") {
        window.location.href = "Journal.html";
    } else if (target === "models") {
        window.location.href = "Journal.html#modelsSection";
    } else if (target === "analytics") {
        closeHeaderMenu();
        const el = document.getElementById("mistakeEmotionAnalytics");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeHeaderMenu();
});

// كتقرا القيم المختارة (checkboxes) من فلتر متعدد الاختيار (Asset / Session)
function getCheckedValues(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    return Array.from(
        container.querySelectorAll('input[type="checkbox"]:checked')
    ).map(input => input.value);
}

function updateFilterLabel(containerId, labelId, placeholder) {
    const values = getCheckedValues(containerId);
    const labelEl = document.getElementById(labelId);
    if (!labelEl) return;
    labelEl.textContent =
        values.length === 0 ? placeholder :
        values.length === 1 ? values[0] :
        values.length + " Selected";
}

function toggleFilterMenu(menuId) {
    const menu = document.getElementById(menuId);
    if (!menu) return;
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}

function onFilterChange() {
    updateFilterLabel("assetFilterOptions", "assetFilterLabel", "All Assets");
    updateFilterLabel("sessionFilterOptions", "sessionFilterLabel", "All Sessions");
    renderTrades();
    updateStats();
    drawChart();
    drawSessionChart();
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

const params = new URLSearchParams(window.location.search);

const currentModel = params.get("name");

document.addEventListener("DOMContentLoaded", function () {
    const titleEl = document.getElementById("modelTitle");
    if (titleEl) titleEl.textContent = currentModel || "Unknown Model";
});


let allTrades =
    sanitizeTrades(
        JSON.parse(
            localStorage.getItem("trades")
        ) || []
    );

let trades =
    allTrades.filter(
        trade =>
        trade.model === currentModel
    );
    
let editIndex = -1;

let chart;
let sessionChart;
let showAllTrades = false;




let mistakesList =
JSON.parse(
localStorage.getItem(
"mistakesList"
)
) || [];

let modelsList =
JSON.parse(
localStorage.getItem(
"modelsList"
)
) || [];

let emotionsList =
JSON.parse(
localStorage.getItem(
"emotionsList"
)
) || [];

function toggleForm(){

const modal =
document.getElementById(
"tradeModal"
);

if(
modal.style.display ===
"flex"
){

modal.style.display =
"none";

}else{

if(editIndex === -1){

document.getElementById(
"tradeForm"
).reset();

// نحدثو labels الـ Custom Select لأن reset() كيبدل .value ديال الـ select
refreshCustomSelect(document.getElementById("asset"));
refreshCustomSelect(document.getElementById("result"));
refreshCustomSelect(document.getElementById("model"));
refreshCustomSelect(document.getElementById("session"));

if (window.dateFieldInstance) window.dateFieldInstance.clear();

editIndex = -1;

document
.querySelectorAll(
'#mistakes input'
)
.forEach(box => {
box.checked = false;
});

document
.querySelectorAll(
'#emotions input'
)
.forEach(box => {
box.checked = false;
});

updateMultiSelectUI("mistakes", "mistakesLabel", "mistakesChips", "Select Mistakes");
updateMultiSelectUI("emotions", "emotionsLabel", "emotionsChips", "Select Emotions");

exitAllDeleteModes();
renderMistakes();
renderEmotionsList();

}

modal.style.display =
"flex";

}

}

document
.getElementById(
"tradeForm"
)
.addEventListener(
"submit",
saveTrade
);

function saveTrade(event){

event.preventDefault();

const file =
document.getElementById(
"screenshot"
).files[0];

const trade = {

asset:
document.getElementById(
"asset"
).value,

model: currentModel,

result:
document.getElementById(
"result"
).value,

resultR:
parseFloat(
document.getElementById(
"resultR"
).value
) || 0,

pnlUSD:
(function(){
    var raw = document.getElementById("pnlUSD").value;
    return raw === "" ? null : (parseFloat(raw) || 0);
})(),

date:
document.getElementById(
"date"
).value,

entryPrice:
parseFloat(
document.getElementById(
"entryPrice"
).value
),

stopLoss:
parseFloat(
document.getElementById(
"stopLoss"
).value
),

takeProfit:
parseFloat(
document.getElementById(
"takeProfit"
).value
),

risk:
parseFloat(
document.getElementById(
"risk"
).value
),

lotSize:
parseFloat(
document.getElementById(
"lotSize"
).value
),

emotion:
Array.from(
document.querySelectorAll(
'#emotions input:checked'
)
).map(
item => item.value
),

session:
document.getElementById(
"session"
).value,

notes:
document.getElementById(
"notes"
).value,

mistakes:
Array.from(
document.querySelectorAll(
'#mistakes input:checked'
)
).map(
item => item.value
),

screenshot: "",

};

const saveData = () => {
    
    if (editIndex !== -1) {
        
        const realIndex =
            allTrades.indexOf(
                trades[editIndex]
            );
        
        trade.id = allTrades[realIndex].id ||
            (window.generateTradeId ? window.generateTradeId() : ("trade_" + Date.now()));
        allTrades[realIndex] = trade;
        
        editIndex = -1;
        
    } else {
        
        trade.id = window.generateTradeId ? window.generateTradeId() : ("trade_" + Date.now());
        allTrades.push(trade);
        
    }
    
    localStorage.setItem(
        "trades",
        JSON.stringify(allTrades)
    );
    if (window.cloudSaveTrade) window.cloudSaveTrade(trade);
    
    trades =
        allTrades.filter(
            t => t.model === currentModel
        );
    
    renderTrades();
    updateStats();
    drawChart();
    
    toggleForm();
    
    document
        .getElementById(
            "tradeForm"
        )
        .reset();
    
};

if(file){

const reader =
new FileReader();

reader.onload = function(e){

const img =
new Image();

img.onload = function(){

const canvas =
document.createElement(
"canvas"
);

const maxWidth = 800;

let width =
img.width;

let height =
img.height;

if(
width > maxWidth
){

height =
height *
(maxWidth / width);

width =
maxWidth;

}

canvas.width =
width;

canvas.height =
height;

const ctx =
canvas.getContext(
"2d"
);

ctx.drawImage(
img,
0,
0,
width,
height
);

trade.screenshot =
canvas.toDataURL(
"image/jpeg",
0.7
);

saveData();

};

img.src =
e.target.result;

};

reader.readAsDataURL(
file
);

}else{

saveData();

}

}

function toggleTrades(){

showAllTrades = !showAllTrades;

renderTrades();

}

function renderTrades(){

const tbody =
document.querySelector(
"#tradesTable tbody"
);

tbody.innerHTML = "";

const selectedAsset =
getCheckedValues("assetFilterOptions");

const selectedModel =
document.getElementById(
"modelFilter"
).value;

const selectedSessions =
getCheckedValues("sessionFilterOptions");

const searchInput =
    document.getElementById("searchTrade");

const searchText =
    searchInput ?
    searchInput.value.toLowerCase() :
    "";

function matchesSearch(trade) {
    if (!searchText) return true;
    const searchableText =
        `${trade.asset}\n${trade.model}\n${trade.notes || ""}\n${trade.tags ? trade.tags.join(" ") : ""}`
        .toLowerCase();
    return searchableText.includes(searchText);
}

let visibleTrades =
showAllTrades
?
trades
:
trades.slice(-10);

visibleTrades = [...visibleTrades].reverse();

const filteredForCount = visibleTrades.filter(trade => {
    if (selectedAsset.length > 0 && !selectedAsset.includes(trade.asset)) return false;
    if (selectedModel !== "All" && trade.model !== selectedModel) return false;
    if (selectedSessions.length > 0 && !selectedSessions.includes(trade.session)) return false;
    if (!matchesSearch(trade)) return false;
    return true;
});

if (filteredForCount.length === 0) {
    tbody.innerHTML = `
<tr>
<td colspan="6">
<div class="empty-state">
<div class="empty-icon"><i data-lucide="inbox"></i></div>
<h3>No trades for this model yet</h3>
<p>Trades you log for this model will appear here.</p>
</div>
</td>
</tr>`;
    document.getElementById("showMoreBtn").style.display = "none";
    return;
}
document.getElementById("showMoreBtn").style.display = "";

visibleTrades.forEach(
        (trade) => {
            
            const realIndex = trades.indexOf(trade);

if(
selectedAsset.length > 0 &&
!selectedAsset.includes(trade.asset)
){
return;
}

if(
selectedModel !== "All" &&
trade.model !== selectedModel
){
return;
}

if(
selectedSessions.length > 0 &&
!selectedSessions.includes(trade.session)
){
return;
}

if (!matchesSearch(trade)) {
return;
}

tbody.innerHTML += `

<tr>

<td>${trade.asset}</td>

<td>${trade.model}</td>

<td>${trade.session}</td>

<td style="
color:${
trade.result === "Win"
? "var(--success)"
: trade.result === "Loss"
? "var(--danger)"
: "var(--text-tertiary)"
};
">
${trade.result}
</td>

<td>${trade.resultR}</td>

<td>
<div class="action-buttons">
<button class="action-btn view-btn" onclick="viewTrade(${realIndex})"><i data-lucide="eye"></i></button>
<button class="action-btn edit-btn" onclick="editTrade(${realIndex})"><i data-lucide="pencil"></i></button>
<button class="action-btn delete-btn" onclick="deleteTrade(${realIndex})"><i data-lucide="trash-2"></i></button>
</div>
</td>

</tr>

`;

});

document.getElementById(
"showMoreBtn"
).textContent =
showAllTrades
?
"Show Less"
:
"Show More";

refreshIcons();

}

function updateStats(){

const selectedAsset =
getCheckedValues("assetFilterOptions");

const selectedSessions =
getCheckedValues("sessionFilterOptions");

const filteredTrades =
trades.filter(trade => {
    if (selectedAsset.length > 0 && !selectedAsset.includes(trade.asset)) return false;
    if (selectedSessions.length > 0 && !selectedSessions.includes(trade.session)) return false;
    return true;
});

const totalTrades =
filteredTrades.length;

const wins =
filteredTrades.filter(
trade =>
trade.result ===
"Win"
).length;

const losses =
filteredTrades.filter(
trade =>
trade.result ===
"Loss"
).length;

const breakevens =
filteredTrades.filter(
trade =>
trade.result ===
"Breakeven"
).length;

const winLossRatio =
losses
?
wins / losses
:
wins;

const totalR =
filteredTrades.reduce(
(sum,trade)=>
sum +
trade.resultR,
0
);

const averageR =
totalTrades
?
totalR /
totalTrades
:
0;

const winRate =
totalTrades
?
(wins /
totalTrades)
* 100
:
0;

const bestTrade =
totalTrades
?
Math.max(
...filteredTrades.map(
trade => trade.resultR
)
)
:
0;

const worstTrade =
totalTrades
?
Math.min(
...filteredTrades.map(
trade => trade.resultR
)
)
:
0;


const grossProfit =
filteredTrades
.filter(
trade => trade.resultR > 0
)
.reduce(
(sum,trade)=>
sum + trade.resultR,
0
);

const grossLoss =
Math.abs(

filteredTrades
.filter(
trade => trade.resultR < 0
)
.reduce(
(sum,trade)=>
sum + trade.resultR,
0
)

);

const profitFactor =
grossLoss
?
grossProfit /
grossLoss
:
0;

const expectancy =
totalTrades
?
totalR /
totalTrades
:
0;

let assetStats = {};

let modelStats = {};

let mistakeStats = {};

let sessionStats = {};

let equity = 0;

let peak = 0;

let maxDrawdown = 0;

filteredTrades.forEach(trade => {

if(!assetStats[trade.asset]){
assetStats[trade.asset] = 0;
}

assetStats[trade.asset] += trade.resultR;

if(!modelStats[trade.model]){
modelStats[trade.model] = 0;
}

modelStats[trade.model] += trade.resultR;

if(!sessionStats[trade.session]){
sessionStats[trade.session] = 0;
}

sessionStats[trade.session] += trade.resultR;

if(trade.mistakes){

trade.mistakes.forEach(mistake => {

if(!mistakeStats[mistake]){
mistakeStats[mistake] = 0;
}

mistakeStats[mistake]++;

});

}


equity += trade.resultR;

if(
equity > peak
){
peak = equity;
}

let drawdown =
peak - equity;

if(
drawdown >
maxDrawdown
){
maxDrawdown =
drawdown;
}

});

let bestAsset = "-";
let bestAssetR = -Infinity;

let bestModel = "-";
let bestModelR = -Infinity;

let bestSession = "-";
let bestSessionR = -Infinity;

let worstSession = "-";
let worstSessionR = Infinity;

let topMistake = "-";
let topMistakeCount = 0;


let currentWinStreak = 0;
let currentLossStreak = 0;

let largestWinStreak = 0;
let largestLossStreak = 0;

filteredTrades.forEach(trade => {

if(trade.result === "Win"){

currentWinStreak++;

currentLossStreak = 0;

if(
currentWinStreak >
largestWinStreak
){

largestWinStreak =
currentWinStreak;

}

}

else if(
trade.result === "Loss"
){

currentLossStreak++;

currentWinStreak = 0;

if(
currentLossStreak >
largestLossStreak
){

largestLossStreak =
currentLossStreak;

}

}

else{

currentWinStreak = 0;
currentLossStreak = 0;

}

});

for(
let model
in modelStats
){

if(
modelStats[model]
>
bestModelR
){

bestModelR =
modelStats[model];

bestModel =
model;

}

}

for(
let session
in sessionStats
){

if(
sessionStats[session] >
bestSessionR
){

bestSessionR =
sessionStats[session];

bestSession =
session;

}

if(
sessionStats[session] <
worstSessionR
){

worstSessionR =
sessionStats[session];

worstSession =
session;

}

}

for(
let asset
in assetStats
){

if(
assetStats[
asset
] >
bestAssetR
){

bestAssetR =
assetStats[
asset
];

bestAsset =
asset;

}

}

(function(){ var _el = document.getElementById("totalTrades"); if (_el) _el.textContent = totalTrades; })();

(function(){ var _el = document.getElementById("winRate"); if (_el) _el.textContent = winRate.toFixed(1)
+ "%"; })();

(function(){ var _el = document.getElementById("totalR"); if (_el) _el.textContent = totalR.toFixed(1); })();

(function(){ var _el = document.getElementById("averageR"); if (_el) _el.textContent = averageR.toFixed(2); })();

(function(){ var _el = document.getElementById("bestTrade"); if (_el) _el.textContent = bestTrade.toFixed(1); })();

(function(){ var _el = document.getElementById("worstTrade"); if (_el) _el.textContent = worstTrade.toFixed(1); })();

(function(){ var _el = document.getElementById("profitFactor"); if (_el) _el.textContent = (grossLoss === 0 && grossProfit > 0)
? "∞"
: profitFactor.toFixed(2); })();

(function(){ var _el = document.getElementById("expectancy"); if (_el) _el.textContent = expectancy.toFixed(2); })();

(function(){ var _el = document.getElementById("bestAsset"); if (_el) _el.textContent = bestAsset; })();

(function(){ var _el = document.getElementById("bestModel"); if (_el) _el.textContent = bestModel; })();

for(
let mistake
in mistakeStats
){

if(
mistakeStats[mistake] >
topMistakeCount
){

topMistakeCount =
mistakeStats[mistake];

topMistake =
mistake;

}

}

(function(){ var _el = document.getElementById("topMistake"); if (_el) _el.textContent = topMistake; })();

(function(){ var _el = document.getElementById("maxDrawdown"); if (_el) _el.textContent = maxDrawdown.toFixed(1)
+ "R"; })();

(function(){ var _el = document.getElementById("totalWins"); if (_el) _el.textContent = wins; })();

(function(){ var _el = document.getElementById("totalLosses"); if (_el) _el.textContent = losses; })();

(function(){ var _el = document.getElementById("totalBE"); if (_el) _el.textContent = breakevens; })();

(function(){ var _el = document.getElementById("winLossRatio"); if (_el) _el.textContent = winLossRatio.toFixed(2); })();

(function(){ var _el = document.getElementById("winStreak"); if (_el) _el.textContent = largestWinStreak; })();

(function(){ var _el = document.getElementById("lossStreak"); if (_el) _el.textContent = largestLossStreak; })();

(function(){ var _el = document.getElementById("bestSession"); if (_el) _el.textContent = bestSession; })();

(function(){ var _el = document.getElementById("worstSession"); if (_el) _el.textContent = worstSession; })();

}


async function deleteTrade(index) {

    if (!(await customConfirm("Delete this trade?"))) {
        return;
    }
    
    const deletedId = trades[index] && trades[index].id;

    allTrades.splice(
        allTrades.indexOf(trades[index]),
        1
    );
    
    localStorage.setItem(
        "trades",
        JSON.stringify(allTrades)
    );
    if (window.cloudDeleteTrade && deletedId) window.cloudDeleteTrade(deletedId);
    
    trades =
        allTrades.filter(
            t => t.model === currentModel
        );
    
    renderTrades();
    updateStats();
    drawChart();
    
}

function editTrade(index){

    let trade = trades[index];

    document.getElementById(
        "asset"
    ).value = trade.asset;

    document.getElementById(
        "result"
    ).value = trade.result;

    document.getElementById(
        "resultR"
    ).value = trade.resultR;

    document.getElementById(
        "pnlUSD"
    ).value = (trade.pnlUSD !== undefined && trade.pnlUSD !== null) ? trade.pnlUSD : "";

document.getElementById(
"model"
).value = trade.model;

if (window.dateFieldInstance) {
    window.dateFieldInstance.setDate(trade.date, true);
} else {
    document.getElementById("date").value = trade.date;
}

document.getElementById(
"session"
).value = trade.session;

// نحدثو label الـ Custom Select لأن .value تبدل مباشرة بلا ما يمر من زر الاختيار
refreshCustomSelect(document.getElementById("asset"));
refreshCustomSelect(document.getElementById("result"));
refreshCustomSelect(document.getElementById("model"));
refreshCustomSelect(document.getElementById("session"));

document.getElementById(
"entryPrice"
).value = trade.entryPrice;

document.getElementById(
"stopLoss"
).value = trade.stopLoss;

document.getElementById(
"takeProfit"
).value = trade.takeProfit;

document.getElementById(
"risk"
).value = trade.risk;

document.getElementById(
"lotSize"
).value = trade.lotSize;

// دعم توافقي: صفقات قديمة قد يكون فيها emotion نص مفرد (قبل التحديث)
const tradeEmotions =
Array.isArray(trade.emotion) ?
trade.emotion :
(trade.emotion ? [trade.emotion] : []);

document
.querySelectorAll(
'#emotions input'
)
.forEach(box => {

box.checked =
tradeEmotions.includes(box.value);

});

ensureOrphanOptions("emotions", tradeEmotions);
updateMultiSelectUI("emotions", "emotionsLabel", "emotionsChips", "Select Emotions");


document.getElementById(
"notes"
).value = trade.notes;

document
.querySelectorAll(
'#mistakes input'
)
.forEach(box => {

box.checked = false;

if(
trade.mistakes &&
trade.mistakes.includes(
box.value
)
){
box.checked = true;
}

});

ensureOrphanOptions("mistakes", trade.mistakes);
updateMultiSelectUI("mistakes", "mistakesLabel", "mistakesChips", "Select Mistakes");

    editIndex = index;

    toggleForm();

}

    renderTrades();

    updateStats();

function viewTrade(index){

    let trade = trades[index];

    document.getElementById(
        "tradeDetails"
    ).innerHTML = `

    <p><b>Asset:</b> ${trade.asset}</p>
    <p><b>Model:</b> ${trade.model}</p>
    <p><b>Session:</b> ${trade.session}</p>
    <p><b>Result:</b> ${trade.result}</p>
    <p><b>R:</b> ${trade.resultR}</p>
    <p><b>Date:</b> ${trade.date}</p>
    <p><b>Entry:</b> ${trade.entryPrice}</p>
    <p><b>Stop Loss:</b> ${trade.stopLoss}</p>
    <p><b>Take Profit:</b> ${trade.takeProfit}</p>
    <p><b>Risk:</b> ${trade.risk}%</p>
    <p><b>Lot Size:</b> ${trade.lotSize}</p>
    <p><b>Emotion:</b> ${trade.emotion}</p>
<p><b>Session:</b> ${trade.session}</p>
<p><b>Notes:</b> ${trade.notes}</p>

<p><b>Mistakes:</b>
${trade.mistakes}
</p>

${trade.screenshot
?
`
<p><b>Screenshot:</b></p>

<img
src="${trade.screenshot}"
style="
width:100%;
margin-top:10px;
border-radius:10px;
"
>
`
:
""
}

    `;

    document.getElementById(
        "viewModal"
    ).style.display = "flex";

}

function closeView(){

    document.getElementById(
        "viewModal"
    ).style.display = "none";

}

// ===================================================================
// Equity Curve — Professional Trading Analytics Redesign
// ===================================================================
let eqMetric = "equity";
let eqRange = "all";

function eqFilterByRange(sortedTrades, range) {
    if (range === "all" || sortedTrades.length === 0) return sortedTrades;
    const now = new Date();
    const cutoff = new Date(now);
    if (range === "1m") cutoff.setMonth(now.getMonth() - 1);
    else if (range === "3m") cutoff.setMonth(now.getMonth() - 3);
    else if (range === "6m") cutoff.setMonth(now.getMonth() - 6);
    else if (range === "1y") cutoff.setFullYear(now.getFullYear() - 1);
    return sortedTrades.filter(function (t) { return new Date(t.date) >= cutoff; });
}

function eqSyncToggleUI() {
    document.querySelectorAll("#eqMetricToggle .eq-toggle-btn").forEach(function (b) {
        b.classList.toggle("active", b.dataset.metric === eqMetric);
    });
    document.querySelectorAll("#eqRangeToggle .eq-toggle-btn").forEach(function (b) {
        b.classList.toggle("active", b.dataset.range === eqRange);
    });
}

function eqSetMetric(metric) {
    eqMetric = metric;
    drawChart();
}

function eqSetRange(range) {
    eqRange = range;
    drawChart();
}

function eqFormatCompactNumber(n) {
    const abs = Math.abs(n);
    let sign = n < 0 ? "-" : "";
    if (abs >= 1000000) return sign + (abs / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (abs >= 1000) return sign + (abs / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return sign + abs.toFixed(abs < 10 ? 1 : 0);
}

const eqCrosshairPlugin = {
    id: "eqCrosshair",
    afterDraw: function (chartInstance) {
        try {
            const active = chartInstance.tooltip && chartInstance.tooltip._active;
            if (!active || !active.length) return;
            const x = active[0].element.x;
            const yScale = chartInstance.scales.y;
            const c = chartInstance.ctx;
            c.save();
            c.beginPath();
            c.setLineDash([4, 4]);
            c.moveTo(x, yScale.top);
            c.lineTo(x, yScale.bottom);
            c.lineWidth = 1;
            c.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--border-color").trim() || "#999";
            c.stroke();
            c.restore();
        } catch (e) { /* no-op */ }
    }
};

const eqPeakLinePlugin = {
    id: "eqPeakLine",
    afterDatasetsDraw: function (chartInstance) {
        try {
            const peakY = chartInstance.$eqPeakY;
            if (peakY === undefined || peakY === null) return;
            const yScale = chartInstance.scales.y;
            const xScale = chartInstance.scales.x;
            const pixelY = yScale.getPixelForValue(peakY);
            const c = chartInstance.ctx;
            c.save();
            c.beginPath();
            c.setLineDash([3, 5]);
            c.moveTo(xScale.left, pixelY);
            c.lineTo(xScale.right, pixelY);
            c.lineWidth = 1;
            c.strokeStyle = "rgba(109,93,252,0.35)";
            c.stroke();
            c.restore();
        } catch (e) { /* no-op */ }
    }
};

function eqExternalTooltip(context) {
    const tooltipEl = document.getElementById("eqTooltip");
    if (!tooltipEl) return;

    const tooltipModel = context.tooltip;

    if (!tooltipModel || tooltipModel.opacity === 0) {
        tooltipEl.style.opacity = 0;
        return;
    }

    const dp = tooltipModel.dataPoints && tooltipModel.dataPoints[0];
    if (dp) {
        const idx = dp.dataIndex;
        const point = window._eqPoints ? window._eqPoints[idx] : null;
        if (point) {
            const isUSD = eqMetric === "usd";
            const metricLabel = isUSD ? "USD" : (eqMetric === "drawdown" ? "Drawdown" : "Equity");
            const valueText = isUSD ? ("$" + point.equity.toFixed(2)) : (point.equity.toFixed(2) + "R");
            const plText = (point.pl === null || point.pl === undefined) ? "-" :
                (isUSD ? ("$" + point.pl.toFixed(2)) : (point.pl.toFixed(2) + "R"));
            const plClass = (point.pl === null || point.pl === undefined) ? "" : (point.pl >= 0 ? "eq-tt-pos" : "eq-tt-neg");

            tooltipEl.innerHTML =
                '<div class="eq-tooltip-date">' + point.dateLabel + '</div>' +
                '<div class="eq-tooltip-row"><span>' + metricLabel + '</span><b>' + valueText + '</b></div>' +
                '<div class="eq-tooltip-row"><span>P/L</span><b class="' + plClass + '">' + plText + '</b></div>' +
                '<div class="eq-tooltip-row"><span>Trade #</span><b>' + (idx + 1) + '</b></div>';
        }
    }

    const canvas = context.chart.canvas;
    const canvasRect = canvas.getBoundingClientRect();
    const wrapRect = canvas.parentElement.getBoundingClientRect();

    tooltipEl.style.opacity = 1;
    let left = tooltipModel.caretX + (canvasRect.left - wrapRect.left);
    left = Math.max(60, Math.min(left, wrapRect.width - 60));
    tooltipEl.style.left = left + "px";
    tooltipEl.style.top = (tooltipModel.caretY + (canvasRect.top - wrapRect.top)) + "px";
}

function eqUpdateHeaderStats(current, peak, drawdown) {
    const isUSD = eqMetric === "usd";
    const prefix = isUSD ? "$" : "";
    const suffix = isUSD ? "" : "R";

    const curEl = document.getElementById("eqCurrentValue");
    const peakEl = document.getElementById("eqPeakValue");
    const ddEl = document.getElementById("eqDrawdownValue");

    if (curEl) curEl.textContent = prefix + current.toFixed(2) + suffix;
    if (peakEl) peakEl.textContent = prefix + (peak === -Infinity ? 0 : peak).toFixed(2) + suffix;
    if (ddEl) ddEl.textContent = prefix + Math.abs(drawdown).toFixed(2) + suffix;
}

function drawChart(){

    const ctx = document.getElementById("equityChart");
    if (!ctx) return;

    eqSyncToggleUI();

    const selectedAsset = getCheckedValues("assetFilterOptions");
    const selectedModel = document.getElementById("modelFilter").value;
    const selectedSessions = getCheckedValues("sessionFilterOptions");

    const filteredTrades = trades.filter(function (trade) {
        if (selectedAsset.length > 0 && !selectedAsset.includes(trade.asset)) return false;
        if (selectedModel !== "All" && trade.model !== selectedModel) return false;
        if (selectedSessions.length > 0 && !selectedSessions.includes(trade.session)) return false;
        return true;
    });

    let sortedTrades = [...filteredTrades].sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
    sortedTrades = eqFilterByRange(sortedTrades, eqRange);

    const emptyState = document.getElementById("eqEmptyState");

    if (sortedTrades.length === 0) {
        if (chart) { chart.destroy(); chart = null; }
        if (emptyState) emptyState.style.display = "flex";
        ctx.style.display = "none";
        eqUpdateHeaderStats(0, 0, 0);
        return;
    }
    if (emptyState) emptyState.style.display = "none";
    ctx.style.display = "block";

    let dates = [];
    let plotValues = [];
    let points = [];
    let total = 0;
    let peak = -Infinity;

    sortedTrades.forEach(function (trade) {

        const rVal = trade.resultR || 0;
        const usdVal = trade.pnlUSD || 0;
        const step = (eqMetric === "usd") ? usdVal : rVal;

        total += step;
        if (total > peak) peak = total;

        const d = new Date(trade.date);
        dates.push(d.toLocaleDateString());

        const plotValue = (eqMetric === "drawdown") ? -(peak - total) : total;
        plotValues.push(plotValue);

        points.push({
            equity: total,
            pl: (eqMetric === "usd")
                ? ((trade.pnlUSD !== null && trade.pnlUSD !== undefined) ? trade.pnlUSD : null)
                : rVal,
            dateLabel: d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        });

    });

    window._eqPoints = points;

    const finalEquity = total;
    const currentDrawdown = peak - total;
    eqUpdateHeaderStats(finalEquity, peak, currentDrawdown);

    if (chart) {
        chart.destroy();
        chart = null;
    }

    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor = rootStyles.getPropertyValue("--primary").trim() || "#6D5DFC";
    const dangerColor = rootStyles.getPropertyValue("--danger").trim() || "#EF4444";
    const gridColor = rootStyles.getPropertyValue("--border-soft").trim();
    const textColor = rootStyles.getPropertyValue("--text-tertiary").trim();

    const lineColor = (eqMetric === "drawdown") ? dangerColor : primaryColor;

    const canvasCtx = ctx.getContext("2d");
    const chartHeight = ctx.parentElement ? ctx.parentElement.clientHeight : 320;
    const gradient = canvasCtx.createLinearGradient(0, 0, 0, chartHeight);
    gradient.addColorStop(0, lineColor + "30");
    gradient.addColorStop(1, lineColor + "00");

    const maxLabels = 7;
    const skip = Math.max(1, Math.ceil(dates.length / maxLabels));

    chart = new Chart(ctx, {

        type: "line",

        data: {
            labels: dates,
            datasets: [{
                label: (eqMetric === "usd") ? "Equity ($)" : (eqMetric === "drawdown") ? "Drawdown" : "Equity (R)",
                data: plotValues,
                tension: 0.35,
                cubicInterpolationMode: "monotone",
                fill: true,
                borderWidth: 2.5,
                pointRadius: 0,
                pointHitRadius: 12,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: lineColor,
                pointHoverBorderColor: "#fff",
                pointHoverBorderWidth: 2,
                borderColor: lineColor,
                backgroundColor: gradient
            }]
        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            animation: { duration: 650, easing: "easeOutQuart" },

            interaction: { mode: "index", intersect: false },

            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: false,
                    external: eqExternalTooltip
                }
            },

            scales: {

                x: {
                    grid: { display: false },
                    ticks: {
                        color: textColor,
                        font: { size: 10.5 },
                        maxRotation: 0,
                        autoSkip: false,
                        callback: function (value, index) {
                            return (index % skip === 0) ? this.getLabelForValue(value) : "";
                        }
                    }
                },

                y: {
                    beginAtZero: false,
                    grid: { color: gridColor, drawTicks: false },
                    ticks: {
                        color: textColor,
                        font: { size: 10.5 },
                        maxTicksLimit: 5,
                        callback: function (value) {
                            const prefix = (eqMetric === "usd") ? "$" : "";
                            const suffix = (eqMetric === "usd") ? "" : "R";
                            return prefix + eqFormatCompactNumber(value) + suffix;
                        }
                    }
                }

            }

        },

        plugins: [eqCrosshairPlugin, eqPeakLinePlugin]

    });

    chart.$eqPeakY = (eqMetric !== "drawdown") ? peak : null;
    chart.update("none");

}

// ===================== Delete Mode (Mistakes/Emotions) =====================
// كي يضغط المستخدم على زر الحذف جنب (+)، القائمة كتبدل لوضع "حذف":
// الضغط على أي عنصر كيمسحو من قائمة الاختيار نهائيًا، بصح الصفقات لي
// عندها هاد العنصر من قبل ما تتأثرش (كنمسحو غير من mistakesList/emotionsList)
let deleteModeState = { mistakes: false, emotions: false };

function toggleDeleteMode(type) {
    deleteModeState[type] = !deleteModeState[type];
    if (type === "mistakes") renderMistakes();
    else if (type === "emotions") renderEmotionsList();
}

function updateDeleteModeButton(type) {
    const btn = document.getElementById(type + "DeleteModeBtn");
    if (btn) btn.classList.toggle("active", !!deleteModeState[type]);
}

function exitAllDeleteModes() {
    deleteModeState = { mistakes: false, emotions: false };
}

function removeFromList(type, value) {

    if (
        (type === "mistakes" && isSystemMistake(value)) ||
        (type === "emotions" && isSystemEmotion(value))
    ) {
        customAlert("System list items cannot be deleted.");
        return;
    }

    let list, storageKey, renderFn;

    if (type === "mistakes") {
        list = mistakesList; storageKey = "mistakesList"; renderFn = renderMistakes;
    } else if (type === "emotions") {
        list = emotionsList; storageKey = "emotionsList"; renderFn = renderEmotionsList;
    } else {
        return;
    }

    const idx = list.indexOf(value);
    if (idx === -1) return;

    list.splice(idx, 1);

    localStorage.setItem(storageKey, JSON.stringify(list));
    if (window.cloudSaveField) window.cloudSaveField(storageKey, list);

    renderFn();

}

function renderMistakes(searchText){

const container =
document.getElementById(
"mistakes"
);

if (!container) return;

const previouslyChecked =
Array.from(
container.querySelectorAll('input[type="checkbox"]:checked')
).map(box => box.value);

const search = (searchText || "").trim().toLowerCase();
container.innerHTML = "";

// ----- وضع الحذف: غير Custom قابل للحذف، System ما يبانش هنا خالص -----
if (deleteModeState.mistakes) {

    const customItems = getMergedMistakesCustom(mistakesList)
        .filter(m => !search || m.toLowerCase().includes(search));

    if (customItems.length === 0) {
        container.innerHTML = `<p style="font-size:12px;color:var(--text-tertiary);padding:6px 8px;">No custom items to remove (System Mistakes cannot be deleted)</p>`;
    } else {
        customItems.forEach(mistake => {
            container.innerHTML += `
<div class="delete-mode-item" onclick="event.stopPropagation(); removeFromList('mistakes','${mistake.replace(/'/g,"\\'")}')">
<i data-lucide="trash-2"></i> ${escapeAttr(mistake)}
</div>
`;
        });
    }

    updateDeleteModeButton("mistakes");
    refreshIcons();
    return;

}

const renderedValues = new Set();

// ----- System Mistakes، مصنفة حسب الأقسام -----
SYSTEM_MISTAKES_CATEGORIES.forEach(cat => {
    const items = cat.items.filter(m => !search || m.toLowerCase().includes(search));
    if (items.length === 0) return;
    container.innerHTML += `<div class="option-group-label">${cat.label}</div>`;
    items.forEach(mistake => {
        renderedValues.add(mistake);
        container.innerHTML += `
<label>
<input
type="checkbox"
value="${escapeAttr(mistake)}"
${previouslyChecked.includes(mistake) ? "checked" : ""}
onchange="updateMultiSelectUI('mistakes','mistakesLabel','mistakesChips','Select Mistakes')"
>
${mistake}
</label>
`;
    });
});

// ----- Custom Mistakes -----
const customItems = getMergedMistakesCustom(mistakesList)
    .filter(m => !search || m.toLowerCase().includes(search));

if (customItems.length > 0) {
    container.innerHTML += `<div class="option-group-label">Custom</div>`;
    customItems.forEach(mistake => {
        renderedValues.add(mistake);
        container.innerHTML += `
<label>
<input
type="checkbox"
value="${escapeAttr(mistake)}"
${previouslyChecked.includes(mistake) ? "checked" : ""}
onchange="updateMultiSelectUI('mistakes','mistakesLabel','mistakesChips','Select Mistakes')"
>
${mistake}
</label>
`;
    });
}

// ----- قيم يتيمة (Orphan): كانت مختارة (صفقة كنعدلو فيها) وتمسحات من
// كل القوائم — كنبقيو نبيّنوها باش ما تضيعش عند الحفظ (نقطة 5) -----
if (!search) {
    previouslyChecked.forEach(value => {
        if (!renderedValues.has(value)) {
            container.innerHTML += `
<label>
<input
type="checkbox"
value="${escapeAttr(value)}"
checked
onchange="updateMultiSelectUI('mistakes','mistakesLabel','mistakesChips','Select Mistakes')"
>
${escapeAttr(value)} <span style="color:var(--text-tertiary);font-size:11px;">(removed from list)</span>
</label>
`;
        }
    });
}

updateMultiSelectUI("mistakes", "mistakesLabel", "mistakesChips", "Select Mistakes");
updateDeleteModeButton("mistakes");
refreshIcons();

}

// ملاحظة: toggleMistakes()/toggleEmotions() القديمة تحذفات — دابا
// كيستعملو toggleFilterMenu() المشتركة (نفس دالة فلاتر Asset/Session)

function addMistake(){

const input =
document.getElementById(
"newMistake"
);

const value =
input.value.trim();

if(!value) return;

if (isSystemMistake(value)) {
    customAlert("This mistake already exists in the System list.");
    input.value = "";
    return;
}

mistakesList.push(value);

localStorage.setItem(
"mistakesList",
JSON.stringify(
mistakesList
)
);
if (window.cloudSaveField) window.cloudSaveField("mistakesList", mistakesList);

renderMistakes();

input.value = "";

}

// ===================== دالة موحدة: label + chips =====================
function updateMultiSelectUI(containerId, labelId, chipsId, placeholder) {

    const container = document.getElementById(containerId);
    const labelEl = document.getElementById(labelId);
    const chipsEl = chipsId ? document.getElementById(chipsId) : null;

    if (!container) return;

    const checked = Array.from(
        container.querySelectorAll('input[type="checkbox"]:checked')
    );

    if (labelEl) {
        labelEl.textContent =
            checked.length === 0 ? placeholder :
            checked.length === 1 ? checked[0].value :
            checked.length + " Selected";
    }

    if (chipsEl) {
        chipsEl.innerHTML = "";
        checked.forEach(function (box) {
            const chip = document.createElement("span");
            chip.className = "chip";
            chip.innerHTML = box.value + ' <i data-lucide="x"></i>';
            chip.querySelector("i").onclick = function (e) {
                e.stopPropagation();
                box.checked = false;
                updateMultiSelectUI(containerId, labelId, chipsId, placeholder);
            };
            chipsEl.appendChild(chip);
        });
        if (window.lucide) window.lucide.createIcons();
    }
}

// ===================== Emotions (قائمة ديناميكية قابلة للإضافة) =====================

function renderEmotionsList(searchText){

const container =
document.getElementById(
"emotions"
);

if (!container) return;

const previouslyChecked =
Array.from(
container.querySelectorAll('input[type="checkbox"]:checked')
).map(box => box.value);

const search = (searchText || "").trim().toLowerCase();
container.innerHTML = "";

if (deleteModeState.emotions) {

    const customItems = getMergedEmotionsCustom(emotionsList)
        .filter(e => !search || e.toLowerCase().includes(search));

    if (customItems.length === 0) {
        container.innerHTML = `<p style="font-size:12px;color:var(--text-tertiary);padding:6px 8px;">No custom items to remove (System Emotions cannot be deleted)</p>`;
    } else {
        customItems.forEach(emotion => {
            container.innerHTML += `
<div class="delete-mode-item" onclick="event.stopPropagation(); removeFromList('emotions','${emotion.replace(/'/g,"\\'")}')">
<i data-lucide="trash-2"></i> ${escapeAttr(emotion)}
</div>
`;
        });
    }

    updateDeleteModeButton("emotions");
    refreshIcons();
    return;

}

const renderedValues = new Set();

const systemItems = SYSTEM_EMOTIONS.filter(e => !search || e.toLowerCase().includes(search));
if (systemItems.length > 0) {
    container.innerHTML += `<div class="option-group-label">Emotions</div>`;
    systemItems.forEach(emotion => {
        renderedValues.add(emotion);
        container.innerHTML += `
<label>
<input
type="checkbox"
value="${escapeAttr(emotion)}"
${previouslyChecked.includes(emotion) ? "checked" : ""}
onchange="updateMultiSelectUI('emotions','emotionsLabel','emotionsChips','Select Emotions')"
>
${emotion}
</label>
`;
    });
}

const customItems = getMergedEmotionsCustom(emotionsList)
    .filter(e => !search || e.toLowerCase().includes(search));

if (customItems.length > 0) {
    container.innerHTML += `<div class="option-group-label">Custom</div>`;
    customItems.forEach(emotion => {
        renderedValues.add(emotion);
        container.innerHTML += `
<label>
<input
type="checkbox"
value="${escapeAttr(emotion)}"
${previouslyChecked.includes(emotion) ? "checked" : ""}
onchange="updateMultiSelectUI('emotions','emotionsLabel','emotionsChips','Select Emotions')"
>
${emotion}
</label>
`;
    });
}

if (!search) {
    previouslyChecked.forEach(value => {
        if (!renderedValues.has(value)) {
            container.innerHTML += `
<label>
<input
type="checkbox"
value="${escapeAttr(value)}"
checked
onchange="updateMultiSelectUI('emotions','emotionsLabel','emotionsChips','Select Emotions')"
>
${escapeAttr(value)} <span style="color:var(--text-tertiary);font-size:11px;">(removed from list)</span>
</label>
`;
        }
    });
}

updateMultiSelectUI("emotions", "emotionsLabel", "emotionsChips", "Select Emotions");
updateDeleteModeButton("emotions");
refreshIcons();

}

function addEmotion(){

const input =
document.getElementById(
"newEmotion"
);

const value =
input.value.trim();

if(!value) return;

if (isSystemEmotion(value)) {
    customAlert("This emotion already exists in the System list.");
    input.value = "";
    return;
}

if(emotionsList.includes(value)){
input.value = "";
return;
}

emotionsList.push(value);

localStorage.setItem(
"emotionsList",
JSON.stringify(
emotionsList
)
);
if (window.cloudSaveField) window.cloudSaveField("emotionsList", emotionsList);

renderEmotionsList();

input.value = "";

}

function renderModels(){

const select =
document.getElementById(
"model"
);

const filter =
document.getElementById(
"modelFilter"
);

select.innerHTML = "";

if(filter){
filter.innerHTML =
'<option value="All">All Models</option>';
}

modelsList.forEach(
model => {

select.innerHTML += `
<option value="${model}">
${model}
</option>
`;

if(filter){

filter.innerHTML += `
<option value="${model}">
${model}
</option>
`;

}

});

refreshCustomSelect(select);
refreshCustomSelect(filter);

}


function drawSessionChart() {
    
    const selectedAsset =
        getCheckedValues("assetFilterOptions");
    
    const selectedModel =
        document.getElementById(
            "modelFilter"
        ).value;
    
    const selectedSessions =
        getCheckedValues("sessionFilterOptions");
    
    const filteredTrades =
        trades.filter(trade => {
            
            if (
                selectedAsset.length > 0 &&
                !selectedAsset.includes(trade.asset)
            ) {
                return false;
            }
            
            if (
                selectedModel !== "All" &&
                trade.model !== selectedModel
            ) {
                return false;
            }
            
            if (
                selectedSessions.length > 0 &&
                !selectedSessions.includes(trade.session)
            ) {
                return false;
            }
            
            return true;
            
        });
    
    let sessions = {
        "Asia": [],
        "London": [],
        "New York AM": [],
        "New York PM": []
    };
    
    filteredTrades.forEach(trade => {

    if(trade.session && sessions[trade.session]){
        sessions[trade.session].push(trade);
    }

});

const ctx =
document.getElementById(
    "sessionChart"
);

if(sessionChart){
    sessionChart.destroy();
}

const sessionColors = [
    getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#6D5DFC",
    getComputedStyle(document.documentElement).getPropertyValue("--primary-hover").trim() || "#8578FF",
    getComputedStyle(document.documentElement).getPropertyValue("--primary-active").trim() || "#5647E8",
    getComputedStyle(document.documentElement).getPropertyValue("--off-white-3").trim() || "#D9D0C2"
];

sessionChart =
new Chart(ctx,{

type:"doughnut",

data:{
labels:Object.keys(sessions),

datasets:[{
data:Object.values(sessions)
.map(session => session.length),
backgroundColor: sessionColors,
borderWidth: 0
}]
},

options:{
responsive:true,
maintainAspectRatio:false,
plugins:{
legend:{
labels:{
color: getComputedStyle(document.documentElement).getPropertyValue("--text-secondary").trim()
}
}
}
}

});

let sessionRows = [];

for(let sessionName in sessions){

    const sessionTrades =
    sessions[sessionName];

    const totalTradesCount =
    sessionTrades.length;

    const wins =
    sessionTrades.filter(
        trade =>
        trade.result === "Win"
    ).length;

    const losses =
    sessionTrades.filter(
        trade =>
        trade.result === "Loss"
    ).length;

    const totalR =
    sessionTrades.reduce(
        (sum,trade)=>
        sum + trade.resultR,
        0
    );

    const winRate =
    (wins + losses) > 0
    ?
    (wins / (wins + losses)) * 100
    :
    0;

    sessionRows.push({
        name: sessionName,
        trades: totalTradesCount,
        totalR: totalR,
        winRate: winRate
    });

}

sessionRows.sort((a, b) => b.totalR - a.totalR);

const rankingContainer = document.getElementById("sessionRanking");
if (rankingContainer) {

    const eligible = sessionRows.filter(s => s.trades > 0);

    if (eligible.length === 0) {
        rankingContainer.innerHTML = `<p style="color:var(--text-tertiary);font-size:13px;text-align:center;">No trades logged yet for the current filters</p>`;
    } else {
        rankingContainer.innerHTML = eligible.map((s, i) => {
            const isBest = i === 0 && s.totalR > 0;
            const isWorst = i === eligible.length - 1 && s.totalR < 0 && eligible.length > 1;
            const rowClass = isBest ? "sa-row sa-row-best" : isWorst ? "sa-row sa-row-worst" : "sa-row";
            const rValueColor = s.totalR > 0 ? "var(--success)" : s.totalR < 0 ? "var(--danger)" : "var(--text-tertiary)";
            return `
            <div class="${rowClass}">
                <span class="sa-row-rank">#${i + 1}</span>
                <div>
                    <div class="sa-row-name">${s.name}${isBest ? " \ud83c\udfc6" : ""}${isWorst ? " \u26a0\ufe0f" : ""}</div>
                    <div class="sa-row-sub">${s.trades} Trades</div>
                    <div class="sa-row-bar-wrap"><div class="sa-row-bar-fill" style="width:${Math.min(s.winRate, 100)}%;"></div></div>
                </div>
                <span class="sa-row-sub">${s.winRate.toFixed(0)}% WR</span>
                <span class="sa-row-r" style="color:${rValueColor};">${(s.totalR >= 0 ? "+" : "") + s.totalR.toFixed(1)}R</span>
            </div>`;
        }).join("");
    }

}

}

function renderModelsCards(){}

// ===================================================================
// نظام تحليل الأخطاء والحالة النفسية (Mistake & Emotion Analytics)
// نفس النظام الموجود فـ journal.js، منقول هنا باش صفحة Model تطابق
// Journal بالكامل — كيقرا من `trades` (المفلترة أصلاً على هاد
// الموديل) + فلاتر Asset/Session الإضافية.
// ===================================================================

function computeMistakeEmotionAnalytics() {

    const selectedAsset = getCheckedValues("assetFilterOptions");
    const selectedModel = document.getElementById("modelFilter").value;
    const selectedSessions = getCheckedValues("sessionFilterOptions");

    const source = trades.filter(trade => {
        if (selectedAsset.length > 0 && !selectedAsset.includes(trade.asset)) return false;
        if (selectedModel !== "All" && trade.model !== selectedModel) return false;
        if (selectedSessions.length > 0 && !selectedSessions.includes(trade.session)) return false;
        return true;
    });

    const mistakeAgg = {};
    const emotionAgg = {};
    const mistakeEmotionCross = {};

    let cleanTrades = 0;
    let totalMistakeInstances = 0;

    let overall = { wins: 0, losses: 0, be: 0, totalR: 0 };

    function ensure(agg, name) {
        if (!agg[name]) {
            agg[name] = { occurrences: 0, wins: 0, losses: 0, be: 0, totalR: 0, winRSum: 0, lossRSum: 0 };
        }
        return agg[name];
    }

    source.forEach(trade => {

        const r = trade.resultR || 0;
        const isWin = trade.result === "Win";
        const isLoss = trade.result === "Loss";
        const isBE = trade.result === "Breakeven";

        if (isWin) overall.wins++;
        if (isLoss) overall.losses++;
        if (isBE) overall.be++;
        overall.totalR += r;

        const mistakes = Array.isArray(trade.mistakes) ? trade.mistakes : [];
        const emotions = Array.isArray(trade.emotion) ? trade.emotion : (trade.emotion ? [trade.emotion] : []);

        if (mistakes.length === 0) cleanTrades++;
        totalMistakeInstances += mistakes.length;

        mistakes.forEach(m => {
            const a = ensure(mistakeAgg, m);
            a.occurrences++;
            if (isWin) { a.wins++; a.winRSum += r; }
            if (isLoss) { a.losses++; a.lossRSum += r; }
            if (isBE) a.be++;
            a.totalR += r;
        });

        emotions.forEach(e => {
            const a = ensure(emotionAgg, e);
            a.occurrences++;
            if (isWin) { a.wins++; a.winRSum += r; }
            if (isLoss) { a.losses++; a.lossRSum += r; }
            if (isBE) a.be++;
            a.totalR += r;

            if (!mistakeEmotionCross[e]) mistakeEmotionCross[e] = {};
            mistakes.forEach(m => {
                mistakeEmotionCross[e][m] = (mistakeEmotionCross[e][m] || 0) + 1;
            });
        });

    });

    return {
        source,
        mistakeAgg,
        emotionAgg,
        mistakeEmotionCross,
        cleanTrades,
        totalMistakeInstances,
        overall,
        totalTrades: source.length
    };
}

function deriveMetrics(agg) {
    const occurrences = agg.occurrences || 0;
    const winRate = occurrences ? (agg.wins / occurrences) * 100 : 0;
    const avgR = occurrences ? agg.totalR / occurrences : 0;
    const avgWinR = agg.wins ? agg.winRSum / agg.wins : 0;
    const avgLossR = agg.losses ? agg.lossRSum / agg.losses : 0;
    const grossProfit = agg.winRSum;
    const grossLoss = Math.abs(agg.lossRSum);
    const profitFactor =
        grossLoss === 0 ?
        (grossProfit > 0 ? Infinity : 0) :
        grossProfit / grossLoss;
    return { occurrences, wins: agg.wins, losses: agg.losses, be: agg.be, winRate, totalR: agg.totalR, avgR, avgWinR, avgLossR, profitFactor };
}

function computeDisciplineScore(analytics) {

    const { totalTrades, cleanTrades, totalMistakeInstances, source } = analytics;

    if (totalTrades === 0) {
        return { basicScore: 0, advancedScore: 0, cleanTrades: 0, totalTrades: 0, avgMistakesPerTrade: "0.00" };
    }

    const basicScore = (cleanTrades / totalTrades) * 100;

    const avgMistakesPerTrade = totalMistakeInstances / totalTrades;
    const frequencyPenalty = Math.min(30, avgMistakesPerTrade * 20);

    const mistakeTrades = source.filter(t => Array.isArray(t.mistakes) && t.mistakes.length > 0);
    const cleanTradesArr = source.filter(t => !Array.isArray(t.mistakes) || t.mistakes.length === 0);

    const avgRMistakeTrades =
        mistakeTrades.length ?
        mistakeTrades.reduce((s, t) => s + (t.resultR || 0), 0) / mistakeTrades.length :
        0;

    const avgRCleanTrades =
        cleanTradesArr.length ?
        cleanTradesArr.reduce((s, t) => s + (t.resultR || 0), 0) / cleanTradesArr.length :
        0;

    const severityGap = Math.max(0, avgRCleanTrades - avgRMistakeTrades);
    const severityPenalty = Math.min(20, severityGap * 5);

    const advancedScore =
        Math.max(0, Math.min(100, basicScore - frequencyPenalty - severityPenalty));

    return {
        basicScore: Math.round(basicScore),
        advancedScore: Math.round(advancedScore),
        cleanTrades,
        totalTrades,
        avgMistakesPerTrade: avgMistakesPerTrade.toFixed(2),
        frequencyPenalty: frequencyPenalty.toFixed(1),
        severityPenalty: severityPenalty.toFixed(1)
    };
}

function generateSmartInsights(analytics) {

    const insights = [];
    const { mistakeAgg, emotionAgg, overall, totalTrades } = analytics;

    if (totalTrades === 0) return insights;

    const mistakeEntries = Object.entries(mistakeAgg).map(([name, agg]) => ({ name, ...deriveMetrics(agg) }));
    const costliest = [...mistakeEntries].sort((a, b) => a.totalR - b.totalR)[0];

    const totalNegativeR = Math.abs(mistakeEntries.reduce((s, m) => s + Math.min(0, m.totalR), 0)) || 0;

    if (costliest && costliest.totalR < 0) {
        const pctOfLosses =
            totalNegativeR > 0 ?
            ((Math.abs(costliest.totalR) / totalNegativeR) * 100).toFixed(0) :
            0;
        insights.push(
            `"${costliest.name}" is your costliest mistake, responsible for ${pctOfLosses}% of total mistake-related losses (${costliest.totalR.toFixed(1)}R).`
        );
    }

    const mostFrequent = [...mistakeEntries].sort((a, b) => b.occurrences - a.occurrences)[0];
    if (mostFrequent && mostFrequent.occurrences > 0) {
        const pctOfTrades = ((mostFrequent.occurrences / totalTrades) * 100).toFixed(0);
        insights.push(
            `"${mostFrequent.name}" is your most frequent mistake, appearing in ${pctOfTrades}% of your trades.`
        );
    }

    const emotionEntries = Object.entries(emotionAgg)
        .map(([name, agg]) => ({ name, ...deriveMetrics(agg) }))
        .filter(e => e.occurrences >= 2);

    if (emotionEntries.length >= 2) {
        const bestEmotion = [...emotionEntries].sort((a, b) => b.avgR - a.avgR)[0];
        const worstEmotion = [...emotionEntries].sort((a, b) => a.avgR - b.avgR)[0];

        if (bestEmotion && worstEmotion && bestEmotion.name !== worstEmotion.name && worstEmotion.avgR !== 0) {
            const ratio = Math.abs(bestEmotion.avgR / worstEmotion.avgR);
            if (isFinite(ratio) && ratio > 1) {
                insights.push(
                    `Your trades in the "${bestEmotion.name}" state achieve ${ratio.toFixed(1)}x higher Average R compared to the "${worstEmotion.name}" state.`
                );
            }
        } else if (bestEmotion) {
            insights.push(
                `The highest Average R (${bestEmotion.avgR.toFixed(2)}R) is achieved in the "${bestEmotion.name}" state.`
            );
        }
    }

    const cleanPct = ((analytics.cleanTrades / totalTrades) * 100).toFixed(0);
    insights.push(
        `${cleanPct}% of your trades have no mistakes logged (${analytics.cleanTrades} of ${totalTrades}).`
    );

    return insights;
}

let analyticsViewState = { mistakePerf: 5, emotionLosing: 5, emotionProfitable: 5, correlation: 5 };

function toggleAnalyticsView(key) {
    analyticsViewState[key] = analyticsViewState[key] === 5 ? 10 : 5;
    renderMistakeEmotionAnalytics();
}

function eaUpdateViewMoreBtn(btnId, totalAvailable, key) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (totalAvailable <= 5) {
        btn.style.display = "none";
    } else {
        btn.style.display = "inline-flex";
        btn.textContent = analyticsViewState[key] === 5 ? "View More" : "Show Less";
    }
}

function renderMistakeEmotionAnalytics() {

    const container = document.getElementById("mistakeEmotionAnalytics");
    if (!container) return;

    const analytics = computeMistakeEmotionAnalytics();
    const { mistakeAgg, emotionAgg, mistakeEmotionCross } = analytics;

    const mistakeEntries = Object.entries(mistakeAgg).map(([name, agg]) => ({ name, ...deriveMetrics(agg) }));
    const emotionEntries = Object.entries(emotionAgg).map(([name, agg]) => ({ name, ...deriveMetrics(agg) }));

    function fmtR(n) { return (n >= 0 ? "+" : "") + n.toFixed(2) + "R"; }
    function colorForR(n) { return n > 0 ? "var(--success)" : n < 0 ? "var(--danger)" : "var(--text-tertiary)"; }

    const mistakesTableEl = document.getElementById("mistakesAnalyticsTable");
    if (mistakesTableEl) {
        const sortedByTotalR = [...mistakeEntries].sort((a, b) => a.totalR - b.totalR);
        const limit = analyticsViewState.mistakePerf;
        const shown = sortedByTotalR.slice(0, limit);

        if (mistakeEntries.length === 0) {
            mistakesTableEl.innerHTML = `<div class="empty-state"><div class="empty-icon"><i data-lucide="inbox"></i></div><h3>No mistakes logged yet</h3><p>Log mistakes on your trades to see the analysis here</p></div>`;
        } else {
            mistakesTableEl.innerHTML = `
            <div class="table-wrap">
            <table>
            <thead><tr>
                <th>Mistake</th><th>Occurrences</th><th>Losses</th>
                <th>Win Rate</th><th>Total R</th><th>Avg R</th>
            </tr></thead>
            <tbody>
            ${shown.map(m => `
                <tr>
                    <td>${m.name}</td>
                    <td>${m.occurrences}</td>
                    <td>${m.losses}</td>
                    <td>${m.winRate.toFixed(1)}%</td>
                    <td style="color:${colorForR(m.totalR)};font-weight:700;">${fmtR(m.totalR)}</td>
                    <td>${m.avgR.toFixed(2)}R</td>
                </tr>
            `).join("")}
            </tbody>
            </table>
            </div>`;
        }
        eaUpdateViewMoreBtn("mistakePerfViewMoreBtn", mistakeEntries.length, "mistakePerf");
    }

    const losingEl = document.getElementById("emotionLosingTable");
    if (losingEl) {
        const losing = [...emotionEntries].filter(e => e.totalR < 0).sort((a, b) => a.totalR - b.totalR);
        const limit = analyticsViewState.emotionLosing;
        const shown = losing.slice(0, limit);

        losingEl.innerHTML = shown.length === 0 ?
            `<p style="color:var(--text-tertiary);font-size:13px;">No emotions have caused a net loss yet</p>` :
            shown.map((e, i) => `
                <div class="rank-list-row">
                    <span class="rank-list-num">#${i + 1}</span>
                    <span class="rank-list-name">${e.name} <span class="rank-list-sub">(${e.occurrences} trades)</span></span>
                    <span class="rank-list-value" style="color:var(--danger);">${fmtR(e.totalR)}</span>
                </div>
            `).join("");
        eaUpdateViewMoreBtn("emotionLosingViewMoreBtn", losing.length, "emotionLosing");
    }

    const profitableEl = document.getElementById("emotionProfitableTable");
    if (profitableEl) {
        const profitable = [...emotionEntries].filter(e => e.totalR > 0).sort((a, b) => b.totalR - a.totalR);
        const limit = analyticsViewState.emotionProfitable;
        const shown = profitable.slice(0, limit);

        profitableEl.innerHTML = shown.length === 0 ?
            `<p style="color:var(--text-tertiary);font-size:13px;">No emotions have achieved a net profit yet</p>` :
            shown.map((e, i) => `
                <div class="rank-list-row">
                    <span class="rank-list-num">#${i + 1}</span>
                    <span class="rank-list-name">${e.name} <span class="rank-list-sub">(${e.occurrences} trades)</span></span>
                    <span class="rank-list-value" style="color:var(--success);">${fmtR(e.totalR)}</span>
                </div>
            `).join("");
        eaUpdateViewMoreBtn("emotionProfitableViewMoreBtn", profitable.length, "emotionProfitable");
    }

    const correlationEl = document.getElementById("mistakeEmotionCorrelation");
    if (correlationEl) {
        const pairs = [];
        Object.entries(mistakeEmotionCross).forEach(([emotion, mistakesCount]) => {
            const totalForEmotion = Object.values(mistakesCount).reduce((s, c) => s + c, 0);
            Object.entries(mistakesCount).forEach(([mistake, count]) => {
                pairs.push({
                    mistake,
                    emotion,
                    occurrences: count,
                    percentage: totalForEmotion ? (count / totalForEmotion) * 100 : 0
                });
            });
        });
        pairs.sort((a, b) => b.occurrences - a.occurrences);

        const limit = analyticsViewState.correlation;
        const shown = pairs.slice(0, limit);

        if (pairs.length === 0) {
            correlationEl.innerHTML = `<p style="color:var(--text-tertiary);font-size:13px;">Log trades with both an emotion and a mistake together to see the analysis here</p>`;
        } else {
            correlationEl.innerHTML = `
            <div class="table-wrap">
            <table>
            <thead><tr>
                <th>Mistake</th><th>Emotion</th><th>Occurrences</th><th>Percentage</th>
            </tr></thead>
            <tbody>
            ${shown.map(p => `
                <tr>
                    <td>${p.mistake}</td>
                    <td>${p.emotion}</td>
                    <td>${p.occurrences}</td>
                    <td>${p.percentage.toFixed(0)}%</td>
                </tr>
            `).join("")}
            </tbody>
            </table>
            </div>`;
        }
        eaUpdateViewMoreBtn("correlationViewMoreBtn", pairs.length, "correlation");
    }

    const insightsEl = document.getElementById("smartInsightsList");
    if (insightsEl) {
        const insights = generateSmartInsights(analytics);
        insightsEl.innerHTML = insights.length === 0 ?
            `<p style="color:var(--text-tertiary);font-size:13px;">Log more trades (with mistakes and emotions) to see smart insights here</p>` :
            insights.map(i => `<div class="insight-card"><i data-lucide="lightbulb"></i><span>${i}</span></div>`).join("");
    }

    const disciplineEl = document.getElementById("disciplineScoreCard");
    if (disciplineEl) {
        const score = computeDisciplineScore(analytics);
        const scoreColor = score.advancedScore >= 70 ? "var(--success)" : score.advancedScore >= 40 ? "#F59E0B" : "var(--danger)";
        disciplineEl.innerHTML = `
            <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;">
                <div style="text-align:center;">
                    <div style="font-size:42px;font-weight:800;color:${scoreColor};">${score.advancedScore}</div>
                    <div style="font-size:11px;color:var(--text-tertiary);">Discipline Score (Advanced)</div>
                </div>
                <div style="flex:1;min-width:200px;font-size:13px;color:var(--text-secondary);line-height:1.9;">
                    <div>Basic Score: <b>${score.basicScore}</b> (${score.cleanTrades}/${score.totalTrades} clean trades)</div>
                    <div>Average mistakes per trade: <b>${score.avgMistakesPerTrade}</b></div>
                    <div style="font-size:11px;color:var(--text-tertiary);">Frequency penalty: -${score.frequencyPenalty} | Severity penalty: -${score.severityPenalty}</div>
                </div>
            </div>`;
    }

    refreshIcons();

}

renderMistakes();
renderEmotionsList();
renderModels();
renderTrades();
updateStats();
drawChart();
drawSessionChart();
renderMistakeEmotionAnalytics();

// Hook: كل مرة تتعيط updateStats() (بعد Add/Edit/Delete/Import/Filter/Sync
// عبر أي نقطة استدعاء فالملف)، نعاودو نرسمو Mistake & Emotion Analytics
// معاها تلقائيًا — بلا ما نبدلو كل نقطة استدعاء وحدة وحدة.
const _meaOrigUpdateStats = window.updateStats;
if (typeof _meaOrigUpdateStats === "function") {
    window.updateStats = function () {
        _meaOrigUpdateStats.apply(this, arguments);
        try { renderMistakeEmotionAnalytics(); } catch (e) { console.error("Analytics render error:", e); }
    };
}

window.addEventListener("cloudDataReady", function () {

    allTrades = sanitizeTrades(JSON.parse(localStorage.getItem("trades")) || []);
    trades = allTrades.filter(t => t.model === currentModel);
    modelsList = JSON.parse(localStorage.getItem("modelsList")) || modelsList;
    mistakesList = JSON.parse(localStorage.getItem("mistakesList")) || mistakesList;
    emotionsList = JSON.parse(localStorage.getItem("emotionsList")) || emotionsList;

    renderMistakes();
    renderEmotionsList();
    renderModels();
    renderTrades();
    updateStats();
    drawChart();
    drawSessionChart();

});

// عند تبديل الثيم (Dark/Light)، نعاودو نرسمو الرسوم البيانية بألوان الثيم الجديد
window.addEventListener("themeChanged", function () {
    drawChart();
    drawSessionChart();
});

// نسدو قوائم الفلاتر المتعددة (Asset/Session) كي المستخدم يضغط برا منهم
document.addEventListener("click", function (e) {
    document.querySelectorAll(".filter-dropdown").forEach(function (dropdown) {
        if (!dropdown.contains(e.target)) {
            const filterMenu = dropdown.querySelector(".filter-menu");
            if (filterMenu) filterMenu.style.display = "none";
        }
    });
});

// Date Picker احترافي (نقطة 2) — بيدير حقل #date بلا التقويم الافتراضي للمتصفح
let dateFieldInstance = null;
if (window.flatpickr) {
    dateFieldInstance = flatpickr("#date", {
        enableTime: true,
        dateFormat: "Y-m-d\\TH:i",
        time_24hr: true,
        allowInput: false
    });
}
window.dateFieldInstance = dateFieldInstance;

// ===================================================================
// Performance Dashboard — نفس النظام الموجود فـ Journal.html، منقول
// هنا كاملاً باش صفحة Model تطابق Journal بالكامل (نفس البطاقات،
// نفس الحسابات)، ماعدا مقارنة "Best/Worst Model" (ماشي منطقية فصفحة
// موديل واحد) — الـ HTML هنا ما فيهش pdCompareModel أصلاً فكيتجاهلها
// تلقائيًا (كل عناصر DOM هنا محمية بـ null-check أصلاً).
// ===================================================================
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

    // علامة تشخيصية: إذا ما بانتش هاد الرسالة فـ Console، معناه
    // ملف stats-dashboard.js ما تحملش أصلاً (404 أو مسار خاطئ) —
    // السبب الأكثر احتمالاً فهاد الحالة هو نسيان رفع الملف لنفس
    // مسار js/ فـ الاستضافة (GitHub Pages).
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
            }
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
            console.error("Failed to save Performance Dashboard settings:", e);
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
            '<div class="pd-gauge-caption">' + (overGoal ? "🎯 Goal reached" : (Math.max(0, target - current) + " trades to go")) + '</div>';

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
            container.innerHTML = '<p style="font-size:12px;color:var(--text-tertiary);text-align:center;padding:20px 0;">Not enough data yet</p>';
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
    function pdComputeLocalDD(dayTrades, field) {
        let equity = 0, peak = 0, worstDD = 0, peakAtWorst = 0;
        dayTrades.forEach(function (t) {
            const v = (field === "pnlUSD") ? (t.pnlUSD || 0) : (t.resultR || 0);
            equity += v;
            if (equity > peak) peak = equity;
            const dd = peak - equity;
            if (dd > worstDD) { worstDD = dd; peakAtWorst = peak; }
        });
        return { dd: worstDD, peakAtDD: peakAtWorst };
    }

    function pdComputeFullDD(sortedTrades, field) {
        let equity = 0, peak = 0, worstDD = 0, peakAtWorstDD = 0;
        sortedTrades.forEach(function (t) {
            const v = (field === "pnlUSD") ? (t.pnlUSD || 0) : (t.resultR || 0);
            equity += v;
            if (equity > peak) peak = equity;
            const dd = peak - equity;
            if (dd > worstDD) { worstDD = dd; peakAtWorstDD = peak; }
        });
        return { current: (peak - equity), currentPeak: peak, worst: worstDD, worstPeak: peakAtWorstDD };
    }

    // كنحسبو مسارين متوازيين: واحد بوحدة R (ديمًا متوفر)، وواحد بالدولار
    // (مبني على trade.pnlUSD الحقل الجديد — إذا الصفقة ماعندهاش قيمة
    // بالدولار، كنعتبروها 0 فهاد المسار بالذات، بلا ما تأثر على مسار R).
    // بهاد الطريقة، اختيار "$" فـ البطاقة كيقرا مباشرة من هاد المسار
    // الحقيقي، بلا أي سؤال أو تقدير (valuePerR القديمة تحذفات).
    function pdComputeDrawdowns(filteredSorted) {
        const byDay = {};
        filteredSorted.forEach(function (t) {
            const day = (t.date || "").slice(0, 10);
            if (!day) return;
            if (!byDay[day]) byDay[day] = [];
            byDay[day].push(t);
        });

        const todayKey = new Date().toISOString().slice(0, 10);

        function buildFor(field) {
            const todayResult = pdComputeLocalDD(byDay[todayKey] || [], field);

            let worstDailyDD = 0, worstDailyPeak = 0;
            Object.keys(byDay).forEach(function (day) {
                const r = pdComputeLocalDD(byDay[day], field);
                if (r.dd > worstDailyDD) { worstDailyDD = r.dd; worstDailyPeak = r.peakAtDD; }
            });

            const full = pdComputeFullDD(filteredSorted, field);

            return {
                daily: { value: todayResult.dd, peak: todayResult.peakAtDD },
                peakDaily: { value: worstDailyDD, peak: worstDailyPeak },
                max: { value: full.current, peak: full.currentPeak },
                peakMax: { value: full.worst, peak: full.worstPeak }
            };
        }

        return {
            r: buildFor("resultR"),
            usd: buildFor("pnlUSD")
        };
    }

    // rEntry مبني على R (كيخدم مع "R" و"%")، usdEntry مبني على pnlUSD
    // (كيخدم مباشرة مع "$" — بلا ما نسولو على أي تحويل).
    function pdFormatDrawdownValue(rEntry, usdEntry, mode) {
        if (mode === "%") {
            if (!rEntry.peak || rEntry.peak <= 0) return "0%";
            return ((rEntry.value / rEntry.peak) * 100).toFixed(1) + "%";
        }
        if (mode === "$") {
            return "$" + Math.abs(usdEntry.value).toFixed(0);
        }
        return rEntry.value.toFixed(2) + "R";
    }

    function pdRenderDrawdownCards(filteredSorted) {
        const grid = document.getElementById("pdDrawdownGrid");
        if (!grid) return;

        const dd = pdComputeDrawdowns(filteredSorted);
        const cards = [
            { key: "daily", label: "Daily Drawdown" },
            { key: "peakDaily", label: "Peak Daily Drawdown" },
            { key: "max", label: "Max Drawdown" },
            { key: "peakMax", label: "Peak Max Drawdown" }
        ];

        grid.innerHTML = cards.map(function (c) {
            const mode = pdSettings.drawdown[c.key] || "R";
            const rEntry = dd.r[c.key];
            const usdEntry = dd.usd[c.key];
            return '<div class="pd-card pd-drawdown-card">' +
                '<div class="pd-card-head">' +
                '<span class="pd-card-title">' + c.label + '</span>' +
                '<button type="button" class="pd-icon-btn" title="Eye (coming soon)"><i data-lucide="eye"></i></button>' +
                '</div>' +
                '<div class="pd-drawdown-value">' + pdFormatDrawdownValue(rEntry, usdEntry, mode) + '</div>' +
                (mode === "$" ? '<div style="font-size:9.5px;color:var(--text-tertiary);margin-top:2px;">Based on the manually entered "Profit/Loss in USD" values</div>' : "") +
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
    // كل قسم معزول بـ try/catch خاص بيه: إذا وقع خطأ فـ قسم واحد
    // (مثلاً Drawdown)، باقي الأقسام كيكملو يترسمو عادي، وكيبان
    // فـ الكونصول بالضبط شكون السبب — بلا ما تبقى الصفحة فارغة بصمت.
    // ---------------------------------------------------------------
    function pdSafeRun(label, fn) {
        try {
            fn();
        } catch (e) {
            console.error("[Performance Dashboard] error in " + label + ":", e);
        }
    }

    function pdShowFallback(containerId, msg) {
        const el = document.getElementById(containerId);
        if (el && !el.innerHTML.trim()) {
            el.innerHTML = '<p style="font-size:11px;color:var(--danger);text-align:center;padding:10px 4px;">' + msg + '</p>';
        }
    }

    function renderStatsDashboard() {
        if (!document.getElementById("performanceDashboard")) return;

        let filtered = [];
        let sorted = [];
        pdSafeRun("Reading trade data", function () {
            filtered = pdGetFilteredTrades();
            sorted = pdSortedByDate(filtered);
        });

        pdSafeRun("Total Trades", function () { pdRenderTotalTrades(sorted); });
        pdSafeRun("Win Rate", function () { pdRenderWinRate(sorted); });
        pdSafeRun("Average R", function () { pdRenderAvgR(sorted); });
        pdSafeRun("Small Cards", function () { pdRenderSmallCards(sorted); });
        pdSafeRun("Comparison Cards", function () { pdRenderComparisons(sorted); });
        pdSafeRun("Drawdown Cards", function () { pdRenderDrawdownCards(sorted); });

        // إذا بقى شي حاوية فارغة رغم كل هاد المحاولات (خطأ ماتوقعناهش)،
        // نبينو رسالة بدل الفراغ الصامت
        pdShowFallback("pdTotalTradesGauge", "Failed to load data");
        pdShowFallback("pdWinRateBody", "Failed to load data");
        pdShowFallback("pdAvgRBody", "Failed to load data");

        pdRefreshIcons();
    }

    // ---------------------------------------------------------------
    // واجهة PD.* المستعملة من الـ onclick/onchange فـ الـ HTML
    // ---------------------------------------------------------------
    window.PD = {

        togglePopover: function (anchorId) {
            const anchor = document.getElementById(anchorId);
            if (!anchor) {
                console.error("[Performance Dashboard] no anchor found with id:", anchorId);
                return;
            }
            const popover = anchor.querySelector(".pd-popover");
            if (!popover) {
                console.error("[Performance Dashboard] no popover found inside anchor:", anchorId);
                return;
            }
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
        try { renderStatsDashboard(); } catch (e) { /* no-op */ }
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
