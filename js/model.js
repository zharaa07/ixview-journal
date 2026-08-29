

// كل مرة كنزيدو HTML فيه data-lucide (أزرار، أيقونات...) خاصنا نستدعيو
// هاد الدالة باش Lucide يرسمها كـ SVG. ما تخدمش والو إذا المكتبة ما تحملاتش بعد.
function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
    }
}

// كل مرة كنزيدو HTML فيه data-lucide (أزرار، أيقونات...) خاصنا نستدعيو
// هاد الدالة باش Lucide يرسمها كـ SVG. ما تخدمش والو إذا المكتبة ما تحملاتش بعد.
function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
    }
}

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
<h3>لا توجد صفقات لهاد الموديل بعد</h3>
<p>الصفقات لي غادي تديرها بهاد الموديل غادي تبان هنا.</p>
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

document
.getElementById(
"totalTrades"
)
.textContent =
totalTrades;

document
.getElementById(
"winRate"
)
.textContent =
winRate.toFixed(1)
+ "%";

document
.getElementById(
"totalR"
)
.textContent =
totalR.toFixed(1);

document
.getElementById(
"averageR"
)
.textContent =
averageR.toFixed(2);

document
.getElementById(
"bestTrade"
)
.textContent =
bestTrade.toFixed(1);

document
.getElementById(
"worstTrade"
)
.textContent =
worstTrade.toFixed(1);

document
.getElementById(
"profitFactor"
)
.textContent =
(grossLoss === 0 && grossProfit > 0)
? "∞"
: profitFactor.toFixed(2);

document
.getElementById(
"expectancy"
)
.textContent =
expectancy.toFixed(2);

document
.getElementById(
"bestAsset"
)
.textContent =
bestAsset;

document
.getElementById(
"bestModel"
)
.textContent =
bestModel;

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

document
.getElementById(
"topMistake"
)
.textContent =
topMistake;

document
.getElementById(
"maxDrawdown"
)
.textContent =
maxDrawdown.toFixed(1)
+ "R";

document
.getElementById(
"totalWins"
)
.textContent =
wins;

document
.getElementById(
"totalLosses"
)
.textContent =
losses;

document
.getElementById(
"totalBE"
)
.textContent =
breakevens;

document
.getElementById(
"winLossRatio"
)
.textContent =
winLossRatio.toFixed(2);

document
.getElementById(
"winStreak"
)
.textContent =
largestWinStreak;

document
.getElementById(
"lossStreak"
)
.textContent =
largestLossStreak;

document
.getElementById(
"bestSession"
)
.textContent =
bestSession;

document
.getElementById(
"worstSession"
)
.textContent =
worstSession;

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

function drawChart(){

    const ctx =
    document.getElementById(
        "equityChart"
    );

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

if(
selectedAsset.length > 0 &&
!selectedAsset.includes(trade.asset)
){
return false;
}

if(
selectedModel !== "All" &&
trade.model !== selectedModel
){
return false;
}

if(
selectedSessions.length > 0 &&
!selectedSessions.includes(trade.session)
){
return false;
}

return true;

});

let sortedTrades =
[...filteredTrades]
.sort(
(a,b)=>
new Date(a.date) -
new Date(b.date)
);

let dates = [];
let equity = [];
let total = 0;

sortedTrades.forEach(trade => {

    total += trade.resultR;

    dates.push(
        new Date(trade.date)
        .toLocaleDateString()
    );

    equity.push(total);

});

if(chart){

    chart.destroy();

}

const rootStyles = getComputedStyle(document.documentElement);
const primaryColor = rootStyles.getPropertyValue("--primary").trim() || "#6D5DFC";
const gridColor = rootStyles.getPropertyValue("--border-soft").trim();
const textColor = rootStyles.getPropertyValue("--text-tertiary").trim();

chart = new Chart(ctx, {

type:"line",

data:{
labels:dates,

datasets:[{
label:"Equity Curve",
data:equity,
tension:0.4,
fill:true,
borderWidth:3,
pointRadius:4,
pointHoverRadius:7,
borderColor: primaryColor,
backgroundColor: primaryColor + "22",
pointBackgroundColor: primaryColor,
pointBorderColor: primaryColor
}]
},

options:{

responsive:true,

plugins:{
legend:{
display:false
}
},

scales:{

x:{
grid:{
display:false
},
ticks:{ color: textColor }
},

y:{
beginAtZero:false,
grid:{ color: gridColor },
ticks:{ color: textColor }
}

}

}

});
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
        customAlert("ما يمكنش تحذف عنصر من القائمة الأساسية (System).");
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
        container.innerHTML = `<p style="font-size:12px;color:var(--text-tertiary);padding:6px 8px;">ماكاينش عناصر مخصصة قابلة للحذف (System Mistakes ما يمكنش تتحذف)</p>`;
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
${escapeAttr(value)} <span style="color:var(--text-tertiary);font-size:11px;">(محذوف من القائمة)</span>
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
    customAlert("هاد الخطأ موجود من قبل فالقائمة الأساسية (System).");
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
        container.innerHTML = `<p style="font-size:12px;color:var(--text-tertiary);padding:6px 8px;">ماكاينش عناصر مخصصة قابلة للحذف (System Emotions ما يمكنش تتحذف)</p>`;
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
${escapeAttr(value)} <span style="color:var(--text-tertiary);font-size:11px;">(محذوف من القائمة)</span>
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
    customAlert("هاد الحالة موجودة من قبل فالقائمة الأساسية (System).");
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

let statsHTML = "";

for(let sessionName in sessions){

    const sessionTrades =
    sessions[sessionName];

    const totalTrades =
    sessionTrades.length;

    const wins =
    sessionTrades.filter(
        trade =>
        trade.result === "Win"
    ).length;

    const totalR =
    sessionTrades.reduce(
        (sum,trade)=>
        sum + trade.resultR,
        0
    );

    const winRate =
    totalTrades
    ?
    ((wins / totalTrades) * 100)
    .toFixed(1)
    :
    0;

statsHTML += `
<div class="session-mini-card">
    
    <h3>${sessionName}</h3>
    
    <p>
        <b>Trades:</b>
        ${totalTrades}
    </p>
    
    <p>
        <b>Total R:</b>
        ${totalR.toFixed(1)}
    </p>
    
    <p>
        <b>Win Rate:</b>
        ${winRate}%
    </p>
    
</div>
`;

}

document.getElementById(
    "sessionStats"
).innerHTML =
statsHTML;

}

function renderModelsCards(){}

renderMistakes();
renderEmotionsList();
renderModels();
renderTrades();
updateStats();
drawChart();
drawSessionChart();


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
