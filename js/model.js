

function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
    }
}


// App Header 
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
        // Leave a genuinely never-entered Return % as null (not 0) so the Edit
        // form shows it empty and prompts a real value instead of silently
        // re-saving 0% forever. Calculations already treat null/missing as 0.
        if (typeof t.returnPct !== "number" || !isFinite(t.returnPct)) {
            t.returnPct = null;
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

// Balance chain runs over ALL trades of the account (not just this model): register the full list and refresh at load.
IxBalance.provider = function () { return allTrades; };
(function () {
    if (IxBalance.rebuild(allTrades).changed.length) TradeStore.saveLocal(allTrades);
})();

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

// Closing (X) cancels any edit in progress (otherwise the next "Add Trade" re-opens the old trade in edit mode).
editIndex = -1;
if (window.TradeForm) TradeForm.onClose();

}else{

if(editIndex === -1){

document.getElementById(
"tradeForm"
).reset();


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
if (window.TradeForm) TradeForm.onOpenNew();

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

const trade = Object.assign({}, (editIndex !== -1 && trades[editIndex]) || {}, {

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

returnPct:
parseFloat(
document.getElementById(
"returnPct"
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

screenshot: (editIndex !== -1 && trades[editIndex] && trades[editIndex].screenshot) || "",

});

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
        trade.createdAt = Date.now();
        allTrades.push(trade);
        
    }
    
    TradeStore.commit(allTrades, [trade], (function () {
        var mb = TradeForm.takeManualBalance();
        return mb === null ? null : { trade: trade, value: mb };
    })(), trade);
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

TradeForm.resolveScreenshot(file).then(function(dataUrl){

// A newly chosen file replaces the old screenshot; otherwise the existing one is kept untouched.
if (dataUrl) trade.screenshot = dataUrl;

saveData();

});

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
    
    TradeStore.commit(allTrades, []);
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
        "returnPct"
    ).value = (trade.returnPct !== undefined && trade.returnPct !== null) ? trade.returnPct : "";

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

    if (window.TradeForm) TradeForm.onOpenEdit(trade);
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


// Equity Curve 

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

const eqDrawdownShadePlugin = {
    id: "eqDrawdownShade",
    beforeDatasetsDraw: function (chartInstance) {
        try {
            if (eqMetric !== "equity") return;
            const points = window._eqPoints;
            const peakY = chartInstance.$eqPeakY;
            if (!points || !points.length || peakY === undefined || peakY === null) return;

            const meta = chartInstance.getDatasetMeta(0);
            if (!meta || !meta.data || !meta.data.length) return;

            const yScale = chartInstance.scales.y;
            const c = chartInstance.ctx;
            const dangerColor = getComputedStyle(document.documentElement).getPropertyValue("--danger").trim() || "#EF4444";
            const peakPixelY = yScale.getPixelForValue(peakY);

            let segStart = null;

            const drawSegment = function (start, end) {
                if (start === null || end < start) return;
                c.save();
                c.beginPath();
                c.moveTo(meta.data[start].x, peakPixelY);
                for (let i = start; i <= end; i++) {
                    c.lineTo(meta.data[i].x, meta.data[i].y);
                }
                c.lineTo(meta.data[end].x, peakPixelY);
                c.closePath();
                c.fillStyle = dangerColor + "16";
                c.fill();
                c.restore();
            };

            for (let i = 0; i < points.length; i++) {
                if (points[i].drawdownPct > 0) {
                    if (segStart === null) segStart = i;
                } else if (segStart !== null) {
                    drawSegment(segStart, i - 1);
                    segStart = null;
                }
            }
            if (segStart !== null) drawSegment(segStart, points.length - 1);
        } catch (e) { /* silent */ }
    }
};

const eqPeakMarkerPlugin = {
    id: "eqPeakMarker",
    afterDatasetsDraw: function (chartInstance) {
        try {
            if (eqMetric !== "equity") return;
            const points = window._eqPoints;
            if (!points || !points.length) return;

            let peakIdx = 0;
            for (let i = 1; i < points.length; i++) {
                if (points[i].equity >= points[peakIdx].equity) peakIdx = i;
            }

            const meta = chartInstance.getDatasetMeta(0);
            const el = meta && meta.data && meta.data[peakIdx];
            if (!el) return;

            const c = chartInstance.ctx;
            const rootStyles = getComputedStyle(document.documentElement);
            const primaryColor = rootStyles.getPropertyValue("--primary").trim() || "#6D5DFC";

            c.save();
            c.beginPath();
            c.arc(el.x, el.y, 4.5, 0, Math.PI * 2);
            c.fillStyle = primaryColor;
            c.fill();
            c.lineWidth = 2;
            c.strokeStyle = "#fff";
            c.stroke();
            c.restore();
        } catch (e) { /* silent */ }
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
            const metricLabel = isUSD ? "$" : (eqMetric === "drawdown" ? "Drawdown" : "Cumulative Return");
            const signPrefix = (!isUSD && point.equity >= 0) ? "+" : "";
            const valueText = isUSD ? ("$" + point.equity.toFixed(2)) : (signPrefix + point.equity.toFixed(2) + "%");
            const plText = (point.pl === null || point.pl === undefined) ? "-" :
                (isUSD ? ("$" + point.pl.toFixed(2)) : ((point.pl >= 0 ? "+" : "") + point.pl.toFixed(2) + "%"));
            const plClass = (point.pl === null || point.pl === undefined) ? "" : (point.pl >= 0 ? "eq-tt-pos" : "eq-tt-neg");
            const ddRow = (!isUSD && point.drawdownPct !== undefined)
                ? '<div class="eq-tooltip-row"><span>Drawdown</span><b class="' + (point.drawdownPct > 0 ? "eq-tt-neg" : "") + '">' + point.drawdownPct.toFixed(2) + '%</b></div>'
                : "";

            tooltipEl.innerHTML =
                '<div class="eq-tooltip-date">' + point.dateLabel + '</div>' +
                '<div class="eq-tooltip-row"><span>' + metricLabel + '</span><b>' + valueText + '</b></div>' +
                '<div class="eq-tooltip-row"><span>Trade Return</span><b class="' + plClass + '">' + plText + '</b></div>' +
                ddRow +
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
    const suffix = isUSD ? "" : "%";

    const curEl = document.getElementById("eqCurrentValue");
    const peakEl = document.getElementById("eqPeakValue");
    const ddEl = document.getElementById("eqDrawdownValue");

    if (curEl) curEl.textContent = (isUSD ? "" : (current >= 0 ? "+" : "")) + prefix + current.toFixed(2) + suffix;
    if (peakEl) peakEl.textContent = (isUSD ? "" : ((peak === -Infinity ? 0 : peak) >= 0 ? "+" : "")) + prefix + (peak === -Infinity ? 0 : peak).toFixed(2) + suffix;
    if (ddEl) ddEl.textContent = prefix + Math.abs(drawdown).toFixed(2) + suffix;
}

// Percentage-based Equity & Drawdown Engine (mirrors journal.js — see comments there).
function buildEquitySeries(sortedTrades, startingEquity) {
    startingEquity = (typeof startingEquity === "number" && startingEquity > 0) ? startingEquity : 100;

    let equity = startingEquity;
    let peak = startingEquity;
    const points = [];
    const episodes = [];
    let currentEpisode = null;

    sortedTrades.forEach(function (trade) {
        const r = (typeof trade.returnPct === "number" && isFinite(trade.returnPct)) ? trade.returnPct : 0;
        equity = equity * (1 + r / 100);

        if (equity > peak) {
            if (currentEpisode) { episodes.push(currentEpisode); currentEpisode = null; }
            peak = equity;
        }

        const drawdownPct = peak > 0 ? ((peak - equity) / peak) * 100 : 0;

        if (drawdownPct > 0) {
            if (!currentEpisode) {
                currentEpisode = { maxDrawdownPct: drawdownPct };
            } else if (drawdownPct > currentEpisode.maxDrawdownPct) {
                currentEpisode.maxDrawdownPct = drawdownPct;
            }
        }

        const d = new Date(trade.date);
        points.push({
            equity: equity,
            cumulativeReturnPct: equity - startingEquity,
            tradeReturnPct: r,
            peak: peak,
            drawdownPct: drawdownPct,
            pl: (trade.pnlUSD !== null && trade.pnlUSD !== undefined) ? trade.pnlUSD : null,
            dateLabel: d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        });
    });

    const currentDrawdownPct = points.length ? points[points.length - 1].drawdownPct : 0;
    const maxDrawdownPct = points.reduce(function (m, p) { return Math.max(m, p.drawdownPct); }, 0);
    const averageDrawdownPct = episodes.length
        ? episodes.reduce(function (s, e) { return s + e.maxDrawdownPct; }, 0) / episodes.length
        : 0;

    return {
        points: points,
        startingEquity: startingEquity,
        finalEquity: points.length ? points[points.length - 1].equity : startingEquity,
        peak: points.length ? peak : startingEquity,
        currentDrawdownPct: currentDrawdownPct,
        maxDrawdownPct: maxDrawdownPct,
        averageDrawdownPct: averageDrawdownPct,
        completedEpisodeCount: episodes.length
    };
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

    let sortedTrades = IxBalance.sortTrades(filteredTrades);
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

    if (eqMetric === "usd") {
        // Balance curve: each point is the stored balanceAfter of the compounding chain.
        if (typeof sortedTrades[0].balanceBefore === "number") peak = sortedTrades[0].balanceBefore;
        sortedTrades.forEach(function (trade) {
            total = (typeof trade.balanceAfter === "number" && isFinite(trade.balanceAfter)) ? trade.balanceAfter : total;
            if (total > peak) peak = total;

            const d = new Date(trade.date);
            dates.push(d.toLocaleDateString());
            plotValues.push(total);

            points.push({
                equity: total,
                pl: (trade.pnlUSD !== null && trade.pnlUSD !== undefined) ? trade.pnlUSD : null,
                dateLabel: d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            });
        });
    } else {
        const series = buildEquitySeries(sortedTrades, 100);
        series.points.forEach(function (p, idx) {
            const d = new Date(sortedTrades[idx].date);
            dates.push(d.toLocaleDateString());
            plotValues.push(eqMetric === "drawdown" ? -p.drawdownPct : p.cumulativeReturnPct);
            points.push({
                equity: eqMetric === "drawdown" ? p.drawdownPct : p.cumulativeReturnPct,
                pl: p.tradeReturnPct,
                drawdownPct: p.drawdownPct,
                dateLabel: p.dateLabel
            });
        });
        total = series.finalEquity - series.startingEquity;
        peak = series.peak - series.startingEquity;
        window._eqDrawdownStats = {
            currentDrawdownPct: series.currentDrawdownPct,
            maxDrawdownPct: series.maxDrawdownPct,
            averageDrawdownPct: series.averageDrawdownPct,
            completedEpisodeCount: series.completedEpisodeCount
        };
    }

    window._eqPoints = points;

    const finalEquity = total;
    const currentDrawdown = eqMetric === "usd"
        ? (peak - total)
        : (window._eqDrawdownStats ? window._eqDrawdownStats.currentDrawdownPct : 0);
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
    gradient.addColorStop(0, lineColor + "3D");
    gradient.addColorStop(0.55, lineColor + "12");
    gradient.addColorStop(1, lineColor + "00");

    const maxLabels = 7;
    const skip = Math.max(1, Math.ceil(dates.length / maxLabels));

    try {
    chart = new Chart(ctx, {

        type: "line",

        data: {
            labels: dates,
            datasets: [{
                label: (eqMetric === "usd") ? "Equity ($)" : (eqMetric === "drawdown") ? "Drawdown (%)" : "Equity (%)",
                data: plotValues,
                tension: 0.4,
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
                            const suffix = (eqMetric === "usd") ? "" : "%";
                            return prefix + eqFormatCompactNumber(value) + suffix;
                        }
                    }
                }

            }

        },

        plugins: [eqCrosshairPlugin, eqPeakLinePlugin, eqDrawdownShadePlugin, eqPeakMarkerPlugin]

    });

    chart.$eqPeakY = (eqMetric !== "drawdown") ? peak : null;
    chart.update("none");
    } catch (e) {
        console.error("Equity chart failed to render (other sections are unaffected):", e);
    }

}

// Delete Mode (Mistakes/Emotions)

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

// System Mistakes
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

// Custom Mistakes
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

// label + chips 
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

// Emotions 

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
    
    // Canonical Session Analysis categories — see journal.js for the full
    // explanation (session is manually selected per trade, never derived
    // from date/time). Sydney removed; New York AM/PM now have their own
    // cards instead of being merged into one "New York" bucket.
    const SESSION_ORDER = ["Asia", "London", "New York AM", "New York PM"];

    function canonicalSessionOf(rawSession) {
        if (!rawSession) return null;
        if (rawSession === "New York") return "New York AM"; // legacy trades saved before the AM/PM split
        if (SESSION_ORDER.includes(rawSession)) return rawSession;
        return null;
    }

    let sessions = {};
    SESSION_ORDER.forEach(s => { sessions[s] = []; });

    filteredTrades.forEach(trade => {
        const key = canonicalSessionOf(trade.session);
        if (key) sessions[key].push(trade);
    });

const ctx =
document.getElementById(
    "sessionChart"
);

if(sessionChart){
    try { sessionChart.destroy(); } catch (e) { /* no-op */ }
}

const sessionColors = [
    getComputedStyle(document.documentElement).getPropertyValue("--off-white-3").trim() || "#D9D0C2",
    getComputedStyle(document.documentElement).getPropertyValue("--primary-hover").trim() || "#8578FF",
    getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#6D5DFC",
    getComputedStyle(document.documentElement).getPropertyValue("--primary-active").trim() || "#5647E8"
];

try {
sessionChart =
new Chart(ctx,{

type:"doughnut",

data:{
labels: SESSION_ORDER,

datasets:[{
data: SESSION_ORDER.map(s => sessions[s].length),
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
} catch (e) {
    console.error("Session doughnut chart failed to render (stats below are unaffected):", e);
}

let sessionRows = [];

SESSION_ORDER.forEach(sessionName => {

    const sessionTrades = sessions[sessionName];
    const totalTradesCount = sessionTrades.length;

    const wins = sessionTrades.filter(trade => trade.result === "Win").length;
    const losses = sessionTrades.filter(trade => trade.result === "Loss").length;

    const totalR = sessionTrades.reduce((sum,trade)=> sum + (trade.resultR || 0), 0);
    const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;
    const averageR = totalTradesCount > 0 ? totalR / totalTradesCount : 0;

    const grossProfit = sessionTrades.filter(t => t.resultR > 0).reduce((s,t)=>s+t.resultR, 0);
    const grossLoss = Math.abs(sessionTrades.filter(t => t.resultR < 0).reduce((s,t)=>s+t.resultR, 0));
    const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : (grossProfit > 0 ? Infinity : 0);
    const expectancy = averageR;

    sessionRows.push({
        name: sessionName,
        trades: totalTradesCount,
        totalR: totalR,
        winRate: winRate,
        averageR: averageR,
        profitFactor: profitFactor,
        expectancy: expectancy
    });

});

const cardsGrid = document.getElementById("sessionCardsGrid");
if (cardsGrid) {

    const withTrades = sessionRows.filter(s => s.trades > 0);
    const bestName = withTrades.length ? withTrades.reduce((a,b) => b.totalR > a.totalR ? b : a).name : null;
    const worstName = (withTrades.length > 1)
        ? withTrades.reduce((a,b) => b.totalR < a.totalR ? b : a).name
        : null;
    const worstIsMeaningful = worstName && sessionRows.find(s => s.name === worstName).totalR < 0;

    cardsGrid.innerHTML = SESSION_ORDER.map(name => {
        const s = sessionRows.find(r => r.name === name);
        const isBest = s.name === bestName && s.totalR > 0;
        const isWorst = worstIsMeaningful && s.name === worstName;
        const isEmpty = s.trades === 0;

        const cardClass = "sa-session-card" +
            (isBest ? " sa-session-best" : "") +
            (isWorst ? " sa-session-worst" : "") +
            (isEmpty ? " sa-session-empty" : "");

        const rClass = s.totalR > 0 ? "pos" : s.totalR < 0 ? "neg" : "";
        const pfDisplay = s.profitFactor === Infinity ? "∞" : s.profitFactor.toFixed(2);

        return `
        <div class="${cardClass}">
            <div class="sa-session-head">
                <span class="sa-session-name">${s.name}</span>
                ${isBest ? '<span class="sa-session-badge best">Best</span>' : ""}
                ${isWorst ? '<span class="sa-session-badge worst">Worst</span>' : ""}
            </div>
            <div class="sa-session-trades">${s.trades} Trade${s.trades === 1 ? "" : "s"}</div>
            <div class="sa-session-bar-wrap"><div class="sa-session-bar-fill" style="width:${Math.min(s.winRate, 100)}%;"></div></div>
            <div class="sa-session-metrics">
                <div class="sa-metric">
                    <span class="sa-metric-label">Win Rate</span>
                    <span class="sa-metric-value">${s.winRate.toFixed(0)}%</span>
                </div>
                <div class="sa-metric">
                    <span class="sa-metric-label">Net R</span>
                    <span class="sa-metric-value ${rClass}">${(s.totalR >= 0 ? "+" : "") + s.totalR.toFixed(1)}R</span>
                </div>
                <div class="sa-metric">
                    <span class="sa-metric-label">Avg R</span>
                    <span class="sa-metric-value">${(s.averageR >= 0 ? "+" : "") + s.averageR.toFixed(2)}R</span>
                </div>
                <div class="sa-metric">
                    <span class="sa-metric-label" title="Gross profit ÷ gross loss. Above 1.0 means winning trades outweigh losing trades.">Profit Factor</span>
                    <span class="sa-metric-value">${pfDisplay}</span>
                </div>
                <div class="sa-metric" style="grid-column: 1 / -1;">
                    <span class="sa-metric-label" title="Average R you expect to gain or lose per trade in this session, based on history so far.">Expectancy</span>
                    <span class="sa-metric-value ${rClass}">${(s.expectancy >= 0 ? "+" : "") + s.expectancy.toFixed(2)}R</span>
                </div>
            </div>
        </div>`;
    }).join("");

}

}

function renderModelsCards(){}



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


const _meaOrigUpdateStats = window.updateStats;
if (typeof _meaOrigUpdateStats === "function") {
    window.updateStats = function () {
        _meaOrigUpdateStats.apply(this, arguments);
        try { renderMistakeEmotionAnalytics(); } catch (e) { console.error("Analytics render error:", e); }
    };
}

window.addEventListener("cloudDataReady", function () {

    allTrades = sanitizeTrades(TradeStore.load());
    if (IxBalance.rebuild(allTrades).changed.length) TradeStore.saveLocal(allTrades);
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


window.addEventListener("themeChanged", function () {
    drawChart();
    drawSessionChart();
});

document.addEventListener("click", function (e) {
    document.querySelectorAll(".filter-dropdown").forEach(function (dropdown) {
        if (!dropdown.contains(e.target)) {
            const filterMenu = dropdown.querySelector(".filter-menu");
            if (filterMenu) filterMenu.style.display = "none";
        }
    });
});

// Date Picker
let dateFieldInstance = null;
if (window.flatpickr) {
    dateFieldInstance = flatpickr("#date", {
        enableTime: true,
        dateFormat: "Y-m-d\\TH:i",
        time_24hr: true,
        allowInput: false,
        locale: { firstDayOfWeek: 0 }
    });
}
window.dateFieldInstance = dateFieldInstance;



