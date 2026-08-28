

// كل مرة كنزيدو HTML فيه data-lucide (أزرار، أيقونات...) خاصنا نستدعيو
// هاد الدالة باش Lucide يرسمها كـ SVG. ما تخدمش والو إذا المكتبة ما تحملاتش بعد.
function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
    }
}

// كتقرا القيم المختارة (checkboxes) من فلتر متعدد الاختيار (Asset / Session).
// إذا ما كانش أي اختيار، كنعتبروها "الكل" (بحال ما كان الفلتر القديم "All")
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

// فلتر "All Tags" (نقطة 11): كيبني القائمة من tagsList كل مرة تتفتح
// (باش تبقى محدثة)، وفيها حقل بحث حي لأن عدد الـ Tags ممكن يكبر
function toggleTagsFilterMenu() {
    const menu = document.getElementById("tagsFilterMenu");
    if (!menu) return;
    const opening = menu.style.display !== "block";
    toggleFilterMenu("tagsFilterMenu");
    if (opening) {
        renderTagsFilterOptions("");
        const searchBox = document.getElementById("tagsFilterSearch");
        if (searchBox) { searchBox.value = ""; searchBox.focus(); }
    }
}

// كتخدم كي المستخدم يبدل الاختيار فـ Asset/Session فلتر: كتحدث اللابل
// وتعاود ترسم كل شي (نفس اللي كان كيوقع عند onchange ديال الـ select القديم)
function onFilterChange() {
    updateFilterLabel("assetFilterOptions", "assetFilterLabel", "All Assets");
    updateFilterLabel("sessionFilterOptions", "sessionFilterLabel", "All Sessions");
    updateFilterLabel("tagsFilterOptions", "tagsFilterLabel", "All Tags");
    renderTrades();
    updateStats();
    drawChart();
    drawSessionChart();
    if (typeof renderCalendar === "function") renderCalendar();
}

// كتبني checkboxes فلتر "All Tags" من tagsList، مع حقل بحث لأن عدد
// الـ Tags ممكن يكبر بزاف (نقطة 11)
function renderTagsFilterOptions(searchText) {
    const container = document.getElementById("tagsFilterOptions");
    if (!container) return;
    const previouslyChecked = getCheckedValues("tagsFilterOptions");
    container.innerHTML = "";
    tagsList.forEach(function (tag) {
        if (searchText && tag.toLowerCase().indexOf(searchText.toLowerCase()) === -1) return;
        const label = document.createElement("label");
        label.innerHTML =
            '<input type="checkbox" value="' + tag + '" ' +
            (previouslyChecked.includes(tag) ? "checked " : "") +
            'onchange="onFilterChange()"> ' + tag;
        container.appendChild(label);
    });
}

// حماية: أي صفقة قديمة عندها resultR فاسد (NaN/undefined) كتبدل بـ 0
// بلا ما نمس أي حقل آخر فالصفقة (ما كنمسحوش البيانات، غير كنصلحو رقم واحد فاسد)
function sanitizeTrades(arr) {
    if (!Array.isArray(arr)) return [];
    arr.forEach(t => {
        if (typeof t.resultR !== "number" || !isFinite(t.resultR)) {
            t.resultR = 0;
        }
    });
    return arr;
}

let trades =
sanitizeTrades(
JSON.parse(
localStorage.getItem("trades")
) || []
);

let editIndex = -1;

let chart;
let sessionChart;
let showAllTrades = false;
let monthlyChart;
let currentMonth =
    new Date().getMonth();

let currentYear =
    new Date().getFullYear();




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

let tagsList =
JSON.parse(
localStorage.getItem(
"tagsList"
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

// نحدثو labels الـ Custom Select لأن reset() كيبدل .value
// ديال الـ select الأصلي بلا ما يمر من زر الاختيار
refreshCustomSelect(document.getElementById("asset"));
refreshCustomSelect(document.getElementById("result"));
refreshCustomSelect(document.getElementById("model"));
refreshCustomSelect(document.getElementById("session"));

if (window.dateFieldInstance) window.dateFieldInstance.clear();

document.getElementById(
        "formTitle"
    ).textContent =
    "Add Trade";

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

document
.querySelectorAll(
'#tagsList input'
)
.forEach(box => {
box.checked = false;
});

updateMultiSelectUI("mistakes", "mistakesLabel", "mistakesChips", "Select Mistakes");
updateMultiSelectUI("emotions", "emotionsLabel", "emotionsChips", "Select Emotions");
updateMultiSelectUI("tagsList", "tagsLabel", "tagsChips", "Select Tags");

// نطلعو من وضع الحذف (إذا كان مفعّل) — غير فحالة "صفقة جديدة"،
// باش ما نمسحوش الاختيارات لي editTrade() دابا عمرها قبل ما يوصل هنا
exitAllDeleteModes();
renderTagsList();
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

model:
document.getElementById(
"model"
).value,


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
    ) || 0,

stopLoss:
    parseFloat(
        document.getElementById(
            "stopLoss"
        ).value
    ) || 0,
    
    takeProfit:
    parseFloat(
        document.getElementById(
            "takeProfit"
        ).value
    ) || 0,
    
    risk:
    parseFloat(
        document.getElementById(
            "risk"
        ).value
    ) || 0,
    
    lotSize:
    parseFloat(
        document.getElementById(
            "lotSize"
        ).value
    ) || 0,

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

tags:
    Array.from(
        document.querySelectorAll(
            '#tagsList input:checked'
        )
    ).map(
        item => item.value
    ),

mistakes:
Array.from(
document.querySelectorAll(
'#mistakes input:checked'
)
).map(
item => item.value
),

screenshot:
    editIndex !== -1 ?
    trades[editIndex].screenshot :
    "",

};

const saveData = () => {

if(editIndex === -1){

    trade.id = window.generateTradeId ? window.generateTradeId() : ("trade_" + Date.now());
    trades.push(trade);

}else{

    trade.id = trades[editIndex].id ||
        (window.generateTradeId ? window.generateTradeId() : ("trade_" + Date.now()));
    trades[editIndex] = trade;

    editIndex = -1;

}

localStorage.setItem(
"trades",
JSON.stringify(trades)
);
if (window.cloudSaveTrade) window.cloudSaveTrade(trade);

renderTrades();

updateStats();

drawChart();

renderModelsCards();

renderTagsStats();
renderMistakeEmotionAnalytics();

toggleForm();

renderCalendar();

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

function renderTrades() {
    
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
    
    const selectedTags =
        getCheckedValues("tagsFilterOptions");
    
const searchInput =
    document.getElementById("searchTrade");

const searchText =
    searchInput ?
    searchInput.value.toLowerCase() :
    "";

let visibleTrades =
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
        
        if (
            selectedTags.length > 0 &&
            !(trade.tags && selectedTags.every(t => trade.tags && trade.tags.includes(t)))
        ) {
            return false;
        }
        
        if (searchText) {
            
            const searchableText =
                
                `${trade.asset}
${trade.model}
${trade.notes || ""}
${trade.tags ? trade.tags.join(" ") : ""}`
                
                .toLowerCase();
            
            if (
                !searchableText.includes(searchText)
            ) {
                return false;
            }
            
        }
        
        return true;
        
    });
            
   
    visibleTrades.sort(
        (a, b) =>
        new Date(b.date) -
        new Date(a.date)
    );
    
    document.getElementById(
            "tradeCount"
        ).textContent =
        visibleTrades.length +
        " Trades";
    
    if (visibleTrades.length === 0) {
        tbody.innerHTML = `
<tr>
<td colspan="6">
<div class="empty-state">
<div class="empty-icon"><i data-lucide="inbox"></i></div>
<h3>لا توجد صفقات بعد</h3>
<p>ابدأ بتسجيل أول صفقة ديالك باش تبان هنا الإحصائيات.</p>
</div>
</td>
</tr>`;
        document.getElementById("showMoreBtn").style.display = "none";
        return;
    }
    document.getElementById("showMoreBtn").style.display = "";

    if (!showAllTrades) {
        
        visibleTrades =
            visibleTrades.slice(0, 10);
        
    }
    
    visibleTrades.forEach(trade => {
        
        let index =
            trades.indexOf(trade);
        
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

<button
class="action-btn view-btn"
onclick="viewTrade(${index})"
>
<i data-lucide="eye"></i>
</button>

<button
class="action-btn edit-btn"
onclick="editTrade(${index})"
>
<i data-lucide="pencil"></i>
</button>

<button
class="action-btn delete-btn"
onclick="deleteTrade(${index})"
>
<i data-lucide="trash-2"></i>
</button>

</div>
</td>

</tr>

`;
        
    });
    
    document.getElementById(
            "showMoreBtn"
        ).textContent =
        showAllTrades ?
        "Show Less" :
        "Show More";
    
    refreshIcons();
    
}


function updateStats(){

const selectedAsset =
    getCheckedValues("assetFilterOptions");

const selectedModel =
    document.getElementById(
        "modelFilter"
    ).value;

const selectedSessions =
    getCheckedValues("sessionFilterOptions");

const selectedTags =
    getCheckedValues("tagsFilterOptions");


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
        
        if (
            selectedTags.length > 0 &&
            !(trade.tags && selectedTags.every(t => trade.tags && trade.tags.includes(t)))
        ) {
            return false;
        }
        
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

// Week Total: مجموع R ديال الصفقات فالأسبوع الحالي (من نهار الأحد)
const now = new Date();
const startOfWeek = new Date(now);
startOfWeek.setDate(now.getDate() - now.getDay());
startOfWeek.setHours(0, 0, 0, 0);

const weekTotal = filteredTrades
    .filter(trade => new Date(trade.date) >= startOfWeek)
    .reduce((sum, trade) => sum + (trade.resultR || 0), 0);

const weekTotalEl = document.getElementById("weekTotal");
if (weekTotalEl) weekTotalEl.textContent = weekTotal.toFixed(1);

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


async function deleteTrade(index){

if (!(await customConfirm("Delete this trade?"))) {
    return;
}

    const deletedId = trades[index] && trades[index].id;

    trades.splice(index,1);

    localStorage.setItem(
        "trades",
        JSON.stringify(trades)
    );
    if (window.cloudDeleteTrade && deletedId) window.cloudDeleteTrade(deletedId);

 renderTrades();

updateStats();

drawChart();

renderModelsCards();

renderTagsStats();
renderMistakeEmotionAnalytics();

renderCalendar();

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

// نحدثو label الـ Custom Select (نقطة 1) لأن .value تبدل مباشرة
// بلا ما يمر من زر الاختيار، فالزر ما يعرفش بالتغيير إلا كنخبروه هنا
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
// بدل array. هنا كنطبعوها لـ array فكلتا الحالتين.
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

updateMultiSelectUI("emotions", "emotionsLabel", "emotionsChips", "Select Emotions");


document.getElementById(
"notes"
).value = trade.notes;

document
.querySelectorAll(
'#tagsList input'
)
.forEach(box => {

box.checked = false;

if(
trade.tags &&
trade.tags.includes(
box.value
)
){
box.checked = true;
}

});

updateMultiSelectUI("tagsList", "tagsLabel", "tagsChips", "Select Tags");

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

updateMultiSelectUI("mistakes", "mistakesLabel", "mistakesChips", "Select Mistakes");

    editIndex = index;

document.getElementById(
        "formTitle"
    ).textContent =
    "Edit Trade";

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
    <p><b>Emotion:</b> ${Array.isArray(trade.emotion) ? trade.emotion.join(", ") : (trade.emotion || "")}</p>
<p><b>Notes:</b> ${trade.notes}</p>
<p>
    <b>Tags:</b>
    ${trade.tags
    ?
    trade.tags.join(", ")
    :
    "-"
    }
</p>

<p><b>Mistakes:</b>
${trade.mistakes}
</p>

${trade.screenshot
?
`
<p><b>Screenshot:</b></p>

<img
src="${trade.screenshot}"
onclick="window.open(this.src)"
style="
width:100%;
margin-top:10px;
border-radius:10px;
cursor:pointer;
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

const selectedTags =
getCheckedValues("tagsFilterOptions");

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

if(
selectedTags.length > 0 &&
!(trade.tags && selectedTags.every(t => trade.tags && trade.tags.includes(t)))
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

function renderMistakes(){

const container =
document.getElementById(
"mistakes"
);

const previouslyChecked =
Array.from(
container.querySelectorAll('input[type="checkbox"]:checked')
).map(box => box.value);

container.innerHTML = "";

mistakesList.forEach(
mistake => {

if (deleteModeState.mistakes) {

container.innerHTML += `
<div class="delete-mode-item" onclick="event.stopPropagation(); removeFromList('mistakes','${mistake}')">
<i data-lucide="trash-2"></i> ${mistake}
</div>
`;

} else {

container.innerHTML += `
<label>
<input
type="checkbox"
value="${mistake}"
${previouslyChecked.includes(mistake) ? "checked" : ""}
onchange="updateMultiSelectUI('mistakes','mistakesLabel','mistakesChips','Select Mistakes')"
>
${mistake}
</label>
`;

}

});

if (!deleteModeState.mistakes) {
    updateMultiSelectUI("mistakes", "mistakesLabel", "mistakesChips", "Select Mistakes");
}

updateDeleteModeButton("mistakes");
refreshIcons();

}

// ملاحظة: toggleMistakes()/toggleTagsList()/toggleEmotions() القديمة
// تحذفات — دابا الثلاثة كيستعملو toggleFilterMenu() المشتركة (نفس
// الدالة المستعملة مع فلاتر Asset/Session) باش ما يتكررش نفس المنطق

function addMistake(){

const input =
document.getElementById(
"newMistake"
);

const value =
input.value.trim();

if(!value) return;

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

// ===================== Tags (قابلة لإعادة الاستخدام، بحال Mistakes) =====================

function renderTagsList(){

const container =
document.getElementById(
"tagsList"
);

if (!container) return;

// نحافظو على الاختيارات الحالية قبل ما نمسحو ونعاودو نبنيو القائمة
// (باش استعمال وضع الحذف ما يمسحش اختيار صفقة كتعدل فيها دابا)
const previouslyChecked =
Array.from(
container.querySelectorAll('input[type="checkbox"]:checked')
).map(box => box.value);

container.innerHTML = "";

tagsList.forEach(
tag => {

if (deleteModeState.tags) {

container.innerHTML += `
<div class="delete-mode-item" onclick="event.stopPropagation(); removeFromList('tags','${tag}')">
<i data-lucide="trash-2"></i> ${tag}
</div>
`;

} else {

container.innerHTML += `
<label>
<input
type="checkbox"
value="${tag}"
${previouslyChecked.includes(tag) ? "checked" : ""}
onchange="updateMultiSelectUI('tagsList','tagsLabel','tagsChips','Select Tags')"
>
${tag}
</label>
`;

}

});

if (!deleteModeState.tags) {
    updateMultiSelectUI("tagsList", "tagsLabel", "tagsChips", "Select Tags");
}

updateDeleteModeButton("tags");
refreshIcons();

}

function addTag(){

const input =
document.getElementById(
"newTag"
);

const value =
input.value.trim();

if(!value) return;

if(tagsList.includes(value)){
input.value = "";
return;
}

tagsList.push(value);

localStorage.setItem(
"tagsList",
JSON.stringify(
tagsList
)
);
if (window.cloudSaveField) window.cloudSaveField("tagsList", tagsList);

renderTagsList();
renderTagsFilterOptions("");

input.value = "";

}

// ===================== دالة موحدة: label + chips (Emotions/Tags/Mistakes) =====================
// كتحدث نص الزر ("Select X" أو "N Selected") وكتبني chips قابلة للإزالة
// فوق الزر لكل عنصر مختار، باش يقدر المستخدم يشيل اختيار بضغطة وحدة
// ===================== Delete Mode (Tags/Mistakes/Emotions) =====================
// كي يضغط المستخدم على زر الحذف (🗑️) جنب زر الإضافة (+)، القائمة كتبدل
// لوضع "حذف": الضغط على أي عنصر كيمسحو من قائمة الاختيار نهائيًا (localStorage
// + Firestore)، بصح الصفقات لي عندها هاد العنصر من قبل ما تتأثرش —
// لأننا كنمسو غير من الـ list الأصلية (tagsList/mistakesList/emotionsList)،
// وماشي من trade.tags/trade.mistakes/trade.emotion ديال الصفقات المحفوظة.
let deleteModeState = { tags: false, mistakes: false, emotions: false };

function toggleDeleteMode(type) {
    deleteModeState[type] = !deleteModeState[type];
    if (type === "tags") renderTagsList();
    else if (type === "mistakes") renderMistakes();
    else if (type === "emotions") renderEmotionsList();
}

function updateDeleteModeButton(type) {
    const btn = document.getElementById(type + "DeleteModeBtn");
    if (btn) btn.classList.toggle("active", !!deleteModeState[type]);
}

function exitAllDeleteModes() {
    deleteModeState = { tags: false, mistakes: false, emotions: false };
}

function removeFromList(type, value) {

    let list, storageKey, renderFn;

    if (type === "tags") {
        list = tagsList; storageKey = "tagsList"; renderFn = renderTagsList;
    } else if (type === "mistakes") {
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

    // إذا الـ Tag لي تمسح كان مختار فـ فلتر "All Tags"، نحدثو الفلتر أيضًا
    if (type === "tags" && typeof renderTagsFilterOptions === "function") {
        renderTagsFilterOptions("");
    }
}

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

// ===================== Emotions (قائمة ديناميكية قابلة للإضافة، بحال Mistakes/Tags) =====================

function renderEmotionsList(){

const container =
document.getElementById(
"emotions"
);

if (!container) return;

const previouslyChecked =
Array.from(
container.querySelectorAll('input[type="checkbox"]:checked')
).map(box => box.value);

container.innerHTML = "";

emotionsList.forEach(
emotion => {

if (deleteModeState.emotions) {

container.innerHTML += `
<div class="delete-mode-item" onclick="event.stopPropagation(); removeFromList('emotions','${emotion}')">
<i data-lucide="trash-2"></i> ${emotion}
</div>
`;

} else {

container.innerHTML += `
<label>
<input
type="checkbox"
value="${emotion}"
${previouslyChecked.includes(emotion) ? "checked" : ""}
onchange="updateMultiSelectUI('emotions','emotionsLabel','emotionsChips','Select Emotions')"
>
${emotion}
</label>
`;

}

});

if (!deleteModeState.emotions) {
    updateMultiSelectUI("emotions", "emotionsLabel", "emotionsChips", "Select Emotions");
}

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

function renderTagsStats() {
    
    const container =
        document.getElementById(
            "tagsStats"
        );
    
    let tagStats = {};
    
    trades.forEach(trade => {
        
        if (!trade.tags) return;
        
        trade.tags.forEach(tag => {
            
            if (!tagStats[tag]) {
                
                tagStats[tag] = {
                    count: 0,
                    totalR: 0
                };
                
            }
            
            tagStats[tag].count++;
            
            tagStats[tag].totalR +=
                trade.resultR;
            
        });
        
    });
    
    container.innerHTML = "";
    
    Object.entries(tagStats)
        
        .sort(
            (a, b) =>
            b[1].count -
            a[1].count
        )
        
        .forEach(([tag, data]) => {
            
            container.innerHTML += `

<div class="stat-card">

<h3>${tag}</h3>

<p>
${data.count} Trades
</p>

<p>
${data.totalR.toFixed(1)}R
</p>

</div>

`;
            
        });
    
}
// ===================================================================
// نظام تحليل الأخطاء والحالة النفسية (Mistake & Emotion Analytics)
// ===================================================================
//
// ملاحظة مهمة بخصوص الدقة المالية:
// النظام الحالي ما فيهش رصيد حساب (Account Balance) ولا حجم مركز
// محول للدولار — كاين غير resultR (وحدة R). فـ كل الحسابات هنا
// مبنية على R، وماشي على "$" وهمية. هادشي أدق وأصدق من اختلاق أرقام
// دولار ماعندهاش أساس حقيقي فالبيانات.
//
// الأداء: كل الحساب كيدير مرة وحدة (single-pass O(n)) على الصفقات،
// بدل ما نفلترو الصفقات بوحدها لكل خطأ/حالة (كان غادي يكون O(n×m)
// وبطيء مع آلاف الصفقات). هادشي كيضمن ديما نفس الأرقام مهما كبر عدد
// الصفقات، وبلا احتساب مزدوج — كل صفقة كتترجم فالتجميع مرة وحدة
// فكل خطأ/حالة لي فعليًا موجودة فـ trade.mistakes/trade.emotion ديالها.

function computeMistakeEmotionAnalytics() {

    // النطاق: كل الصفقات (بلا ما يرتبط بفلاتر الداشبورد)، باش الأرقام
    // تبقى ثابتة ومفهومة كتقرير عام، بحال renderTagsStats المجاورة ليه
    const source = trades;

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

// كتحول تجميع خام (aggregate) لمقاييس جاهزة للعرض (Win Rate, Avg R...)
// بنفس المعادلات المطلوبة بالضبط
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

// "مقارنة الأداء بوجود الخطأ وعدم وجوده": كنستافدو من overall - with
// = without (تقسيم رياضي صحيح 100%، لأن كل صفقة إما عندها الخطأ إما لا،
// بلا حاجة نفلترو الصفقات مرة ثانية)
function computeWithWithout(name, agg, overall, totalTrades) {
    const withM = deriveMetrics(agg);

    const withoutRaw = {
        occurrences: totalTrades - agg.occurrences,
        wins: overall.wins - agg.wins,
        losses: overall.losses - agg.losses,
        be: overall.be - agg.be,
        totalR: overall.totalR - agg.totalR
    };
    const withoutM = {
        occurrences: withoutRaw.occurrences,
        wins: withoutRaw.wins,
        losses: withoutRaw.losses,
        winRate: withoutRaw.occurrences ? (withoutRaw.wins / withoutRaw.occurrences) * 100 : 0,
        avgR: withoutRaw.occurrences ? withoutRaw.totalR / withoutRaw.occurrences : 0,
        totalR: withoutRaw.totalR
    };

    return { name, withM, withoutM };
}

// ===================== Discipline Score =====================
// النسخة الأساسية (مطلوبة بالضبط): صفقات بلا أخطاء ÷ إجمالي الصفقات × 100
//
// النسخة المتقدمة: كتاخد بعين الاعتبار (بحال ما طلب):
// 1) نسبة الصفقات النظيفة (نفس الأساسية، أكبر وزن)
// 2) تكرار الأخطاء: متوسط عدد الأخطاء لكل صفقة (avgMistakesPerTrade) —
//    كل ما زاد، كل ما نقصات النقطة (بحد أقصى 30 نقطة عقوبة)
// 3) شدة الأخطاء: الفرق بين متوسط R ديال الصفقات "النظيفة" ومتوسط R
//    ديال الصفقات "فيها خطأ" — كل ما كان الفرق كبير (يعني الأخطاء
//    كتأثر بزاف سلبيًا) كل ما زادت العقوبة (بحد أقصى 20 نقطة)
// الصيغة كاملة موثقة هنا باش تكون قابلة للتعديل مستقبلاً بسهولة.
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

// ===================== Smart Insights =====================
// جمل تلقائية مبنية 100% على الأرقام المحسوبة فوق، بلا نصوص ثابتة
function generateSmartInsights(analytics) {

    const insights = [];
    const { mistakeAgg, emotionAgg, overall, totalTrades } = analytics;

    if (totalTrades === 0) return insights;

    // أكثر خطأ مكلف (بأكبر خسارة R)
    const mistakeEntries = Object.entries(mistakeAgg).map(([name, agg]) => ({ name, ...deriveMetrics(agg) }));
    const costliest = [...mistakeEntries].sort((a, b) => a.totalR - b.totalR)[0];

    const totalNegativeR = Math.abs(mistakeEntries.reduce((s, m) => s + Math.min(0, m.totalR), 0)) || 0;

    if (costliest && costliest.totalR < 0) {
        const pctOfLosses =
            totalNegativeR > 0 ?
            ((Math.abs(costliest.totalR) / totalNegativeR) * 100).toFixed(0) :
            0;
        insights.push(
            `"${costliest.name}" هو أكثر خطأ مكلف، مسؤول عن ${pctOfLosses}% من إجمالي الخسائر المرتبطة بالأخطاء (${costliest.totalR.toFixed(1)}R).`
        );
    }

    // أكثر خطأ تكرارًا
    const mostFrequent = [...mistakeEntries].sort((a, b) => b.occurrences - a.occurrences)[0];
    if (mostFrequent && mostFrequent.occurrences > 0) {
        const pctOfTrades = ((mostFrequent.occurrences / totalTrades) * 100).toFixed(0);
        insights.push(
            `"${mostFrequent.name}" هو أكثر خطأ تكرارًا، ظهر فـ ${pctOfTrades}% من صفقاتك.`
        );
    }

    // أفضل/أسوأ حالة نفسية بـ Average R
    const emotionEntries = Object.entries(emotionAgg)
        .map(([name, agg]) => ({ name, ...deriveMetrics(agg) }))
        .filter(e => e.occurrences >= 2); // نتجاهلو الحالات بصفقة وحدة (عينة صغيرة بزاف)

    if (emotionEntries.length >= 2) {
        const bestEmotion = [...emotionEntries].sort((a, b) => b.avgR - a.avgR)[0];
        const worstEmotion = [...emotionEntries].sort((a, b) => a.avgR - b.avgR)[0];

        if (bestEmotion && worstEmotion && bestEmotion.name !== worstEmotion.name && worstEmotion.avgR !== 0) {
            const ratio = Math.abs(bestEmotion.avgR / worstEmotion.avgR);
            if (isFinite(ratio) && ratio > 1) {
                insights.push(
                    `صفقاتك فحالة "${bestEmotion.name}" كتحقق Average R أعلى بـ ${ratio.toFixed(1)}x مقارنة بحالة "${worstEmotion.name}".`
                );
            }
        } else if (bestEmotion) {
            insights.push(
                `أعلى Average R (${bestEmotion.avgR.toFixed(2)}R) كيتحقق فحالة "${bestEmotion.name}".`
            );
        }
    }

    // نسبة الصفقات النظيفة
    const cleanPct = ((analytics.cleanTrades / totalTrades) * 100).toFixed(0);
    insights.push(
        `${cleanPct}% من صفقاتك بلا أي خطأ مسجل (${analytics.cleanTrades} من ${totalTrades}).`
    );

    return insights;
}


// ===================== الدالة الرئيسية: كتبني كل أقسام التحليل =====================
function renderMistakeEmotionAnalytics() {

    const container = document.getElementById("mistakeEmotionAnalytics");
    if (!container) return; // ماكاينش الحاوية فهاد الصفحة، نخرجو بلا error

    const analytics = computeMistakeEmotionAnalytics();
    const { mistakeAgg, emotionAgg, mistakeEmotionCross, overall, totalTrades } = analytics;

    const mistakeEntries = Object.entries(mistakeAgg).map(([name, agg]) => ({ name, ...deriveMetrics(agg) }));
    const emotionEntries = Object.entries(emotionAgg).map(([name, agg]) => ({ name, ...deriveMetrics(agg) }));

    function fmtR(n) { return (n >= 0 ? "+" : "") + n.toFixed(2) + "R"; }
    function fmtPF(pf) { return pf === Infinity ? "∞" : pf.toFixed(2); }
    function colorForR(n) { return n > 0 ? "var(--success)" : n < 0 ? "var(--danger)" : "var(--text-tertiary)"; }

    // ---------- 1) جدول أداء الأخطاء ----------
    let mistakesTableHTML = "";
    if (mistakeEntries.length === 0) {
        mistakesTableHTML = `<div class="empty-state"><div class="empty-icon"><i data-lucide="inbox"></i></div><h3>لا توجد أخطاء مسجلة بعد</h3><p>سجل الأخطاء فالصفقات باش يبان هنا التحليل</p></div>`;
    } else {
        mistakesTableHTML = `
        <div class="table-wrap">
        <table>
        <thead><tr>
            <th>Mistake</th><th>Occurrences</th><th>Wins</th><th>Losses</th>
            <th>Win Rate</th><th>Total R</th><th>Avg R</th><th>Avg Win R</th><th>Avg Loss R</th>
        </tr></thead>
        <tbody>
        ${[...mistakeEntries].sort((a, b) => b.occurrences - a.occurrences).map(m => `
            <tr>
                <td>${m.name}</td>
                <td>${m.occurrences}</td>
                <td>${m.wins}</td>
                <td>${m.losses}</td>
                <td>${m.winRate.toFixed(1)}%</td>
                <td style="color:${colorForR(m.totalR)};font-weight:700;">${fmtR(m.totalR)}</td>
                <td>${m.avgR.toFixed(2)}R</td>
                <td>${m.avgWinR.toFixed(2)}R</td>
                <td>${m.avgLossR.toFixed(2)}R</td>
            </tr>
        `).join("")}
        </tbody>
        </table>
        </div>`;
    }
    const mistakesTableEl = document.getElementById("mistakesAnalyticsTable");
    if (mistakesTableEl) mistakesTableEl.innerHTML = mistakesTableHTML;

    // ---------- 2) تكلفة كل خطأ (ترتيب حسب أكبر خسارة R) ----------
    const costRankingEl = document.getElementById("mistakeCostRanking");
    if (costRankingEl) {
        const costliest = [...mistakeEntries].filter(m => m.totalR < 0).sort((a, b) => a.totalR - b.totalR).slice(0, 5);
        costRankingEl.innerHTML = costliest.length === 0 ?
            `<p style="color:var(--text-tertiary);font-size:13px;">ماكاينش أخطاء سببت خسارة سلبية بعد</p>` :
            costliest.map((m, i) => `
                <div class="cost-rank-row">
                    <span class="cost-rank-num">#${i + 1}</span>
                    <span class="cost-rank-name">${m.name}</span>
                    <span class="cost-rank-value" style="color:var(--danger);">${fmtR(m.totalR)}</span>
                </div>
            `).join("");
    }

    // ---------- 3) أكثر الأخطاء تكرارًا (رسم بياني) ----------
    const freqCanvas = document.getElementById("mistakeFrequencyChart");
    if (freqCanvas) {
        if (window._mistakeFreqChart) window._mistakeFreqChart.destroy();
        const sorted = [...mistakeEntries].sort((a, b) => b.occurrences - a.occurrences);
        if (sorted.length > 0) {
            const rootStyles = getComputedStyle(document.documentElement);
            window._mistakeFreqChart = new Chart(freqCanvas, {
                type: "bar",
                data: {
                    labels: sorted.map(m => m.name),
                    datasets: [{
                        data: sorted.map(m => m.occurrences),
                        backgroundColor: rootStyles.getPropertyValue("--primary").trim() || "#6D5DFC"
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: "y",
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: rootStyles.getPropertyValue("--text-tertiary").trim(), stepSize: 1 }, grid: { color: rootStyles.getPropertyValue("--border-soft").trim() } },
                        y: { ticks: { color: rootStyles.getPropertyValue("--text-primary").trim() }, grid: { display: false } }
                    }
                }
            });
        }
    }

    // ---------- 4) مقارنة الأداء بوجود/عدم وجود كل خطأ ----------
    const withoutTableEl = document.getElementById("mistakeWithWithoutTable");
    if (withoutTableEl) {
        if (mistakeEntries.length === 0) {
            withoutTableEl.innerHTML = "";
        } else {
            withoutTableEl.innerHTML = `
            <div class="table-wrap">
            <table>
            <thead><tr>
                <th>Mistake</th>
                <th>Win Rate (With)</th><th>Win Rate (Without)</th>
                <th>Avg R (With)</th><th>Avg R (Without)</th>
                <th>Net R (With)</th><th>Net R (Without)</th>
            </tr></thead>
            <tbody>
            ${Object.entries(mistakeAgg).map(([name, agg]) => {
                const cmp = computeWithWithout(name, agg, overall, totalTrades);
                return `
                <tr>
                    <td>${name}</td>
                    <td>${cmp.withM.winRate.toFixed(1)}%</td>
                    <td>${cmp.withoutM.winRate.toFixed(1)}%</td>
                    <td style="color:${colorForR(cmp.withM.avgR)};">${cmp.withM.avgR.toFixed(2)}R</td>
                    <td style="color:${colorForR(cmp.withoutM.avgR)};">${cmp.withoutM.avgR.toFixed(2)}R</td>
                    <td style="color:${colorForR(cmp.withM.totalR)};">${fmtR(cmp.withM.totalR)}</td>
                    <td style="color:${colorForR(cmp.withoutM.totalR)};">${fmtR(cmp.withoutM.totalR)}</td>
                </tr>`;
            }).join("")}
            </tbody>
            </table>
            </div>`;
        }
    }

    // ---------- 5) جدول أداء الحالة النفسية ----------
    const emotionsTableEl = document.getElementById("emotionsAnalyticsTable");
    if (emotionsTableEl) {
        emotionsTableEl.innerHTML = emotionEntries.length === 0 ?
            `<div class="empty-state"><div class="empty-icon"><i data-lucide="inbox"></i></div><h3>لا توجد حالات نفسية مسجلة بعد</h3></div>` :
            `<div class="table-wrap">
            <table>
            <thead><tr>
                <th>Emotion</th><th>Trades</th><th>Win Rate</th><th>Profit Factor</th>
                <th>Avg R</th><th>Avg Win R</th><th>Avg Loss R</th><th>Total R</th>
            </tr></thead>
            <tbody>
            ${[...emotionEntries].sort((a, b) => b.occurrences - a.occurrences).map(e => `
                <tr>
                    <td>${e.name}</td>
                    <td>${e.occurrences}</td>
                    <td>${e.winRate.toFixed(1)}%</td>
                    <td>${fmtPF(e.profitFactor)}</td>
                    <td>${e.avgR.toFixed(2)}R</td>
                    <td>${e.avgWinR.toFixed(2)}R</td>
                    <td>${e.avgLossR.toFixed(2)}R</td>
                    <td style="color:${colorForR(e.totalR)};font-weight:700;">${fmtR(e.totalR)}</td>
                </tr>
            `).join("")}
            </tbody>
            </table>
            </div>`;
    }

    // ---------- 6) أفضل/أسوأ حالة نفسية ----------
    const bestWorstEl = document.getElementById("emotionBestWorstCards");
    if (bestWorstEl) {
        const eligible = emotionEntries.filter(e => e.occurrences >= 1);
        if (eligible.length === 0) {
            bestWorstEl.innerHTML = "";
        } else {
            const bestByR = [...eligible].sort((a, b) => b.avgR - a.avgR)[0];
            const bestByWinRate = [...eligible].sort((a, b) => b.winRate - a.winRate)[0];
            const bestByNet = [...eligible].sort((a, b) => b.totalR - a.totalR)[0];
            const worstByR = [...eligible].sort((a, b) => a.avgR - b.avgR)[0];
            const worstByWinRate = [...eligible].sort((a, b) => a.winRate - b.winRate)[0];
            const worstByNet = [...eligible].sort((a, b) => a.totalR - b.totalR)[0];

            function emotionCard(title, iconColor, items) {
                return `
                <div class="card">
                    <h3 style="color:${iconColor};margin-bottom:10px;">${title}</h3>
                    ${items.map(it => `
                        <div class="emotion-rank-row">
                            <span>${it.label}</span>
                            <b>${it.emotion.name} <span style="color:var(--text-tertiary);font-weight:400;">(${it.emotion.occurrences} trades)</span></b>
                            <span style="color:${it.color || "var(--text-primary)"};">${it.value}</span>
                        </div>
                    `).join("")}
                </div>`;
            }

            bestWorstEl.innerHTML =
                emotionCard("🏆 أفضل حالة نفسية", "var(--success)", [
                    { label: "بـ Average R:", emotion: bestByR, value: bestByR.avgR.toFixed(2) + "R", color: "var(--success)" },
                    { label: "بـ Win Rate:", emotion: bestByWinRate, value: bestByWinRate.winRate.toFixed(1) + "%", color: "var(--success)" },
                    { label: "بـ Net R:", emotion: bestByNet, value: fmtR(bestByNet.totalR), color: "var(--success)" }
                ]) +
                emotionCard("⚠️ أسوأ حالة نفسية", "var(--danger)", [
                    { label: "بـ Average R:", emotion: worstByR, value: worstByR.avgR.toFixed(2) + "R", color: "var(--danger)" },
                    { label: "بـ Win Rate:", emotion: worstByWinRate, value: worstByWinRate.winRate.toFixed(1) + "%", color: "var(--danger)" },
                    { label: "بـ Net R:", emotion: worstByNet, value: fmtR(worstByNet.totalR), color: "var(--danger)" }
                ]);
        }
    }

    // ---------- 7) ربط الأخطاء بالحالة النفسية ----------
    const correlationEl = document.getElementById("mistakeEmotionCorrelation");
    if (correlationEl) {
        const entries = Object.entries(mistakeEmotionCross);
        if (entries.length === 0) {
            correlationEl.innerHTML = `<p style="color:var(--text-tertiary);font-size:13px;">محتاجين صفقات فيها حالة نفسية وخطأ مسجلين مع بعض باش يبان هنا تحليل</p>`;
        } else {
            correlationEl.innerHTML = entries.map(([emotion, mistakesCount]) => {
                const totalForEmotion = Object.values(mistakesCount).reduce((s, c) => s + c, 0);
                const sortedMistakes = Object.entries(mistakesCount).sort((a, b) => b[1] - a[1]);
                return `
                <div class="correlation-card">
                    <h4>${emotion}</h4>
                    ${sortedMistakes.map(([mName, count]) => {
                        const pct = ((count / totalForEmotion) * 100).toFixed(0);
                        return `<div class="correlation-row"><span>${mName}</span><span>${pct}%</span></div>`;
                    }).join("")}
                </div>`;
            }).join("");
        }
    }

    // ---------- 8) Smart Insights ----------
    const insightsEl = document.getElementById("smartInsightsList");
    if (insightsEl) {
        const insights = generateSmartInsights(analytics);
        insightsEl.innerHTML = insights.length === 0 ?
            `<p style="color:var(--text-tertiary);font-size:13px;">سجل صفقات أكثر (بأخطاء وحالات نفسية) باش تبان هنا استنتاجات ذكية</p>` :
            insights.map(i => `<div class="insight-card"><i data-lucide="lightbulb"></i><span>${i}</span></div>`).join("");
    }

    // ---------- 9) Discipline Score ----------
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
                    <div>Basic Score: <b>${score.basicScore}</b> (${score.cleanTrades}/${score.totalTrades} صفقة نظيفة)</div>
                    <div>متوسط الأخطاء لكل صفقة: <b>${score.avgMistakesPerTrade}</b></div>
                    <div style="font-size:11px;color:var(--text-tertiary);">عقوبة التكرار: -${score.frequencyPenalty} | عقوبة الشدة: -${score.severityPenalty}</div>
                </div>
            </div>`;
    }

    refreshIcons();

}


function renderCalendar() {

const calendar =
document.getElementById("calendar");

const monthTitle =
document.getElementById("monthTitle");

calendar.innerHTML = "";

const monthNames = [
"January","February","March","April",
"May","June","July","August",
"September","October","November","December"
];

monthTitle.textContent =
monthNames[currentMonth] +
" " +
currentYear;

const dayNames = [
"Sun","Mon","Tue",
"Wed","Thu","Fri","Sat"
];

dayNames.forEach(day => {

calendar.innerHTML +=
`<div class="calendar-day-name">${day}</div>`;

});

const firstDay =
new Date(
currentYear,
currentMonth,
1
).getDay();

const daysInMonth =
new Date(
currentYear,
currentMonth + 1,
0
).getDate();

for(let i = 0; i < firstDay; i++){

calendar.innerHTML +=
`<div class="empty-cell"></div>`;

}

const selectedAsset =
getCheckedValues("assetFilterOptions");

const selectedModel =
document.getElementById(
"modelFilter"
).value;

const selectedSessions =
getCheckedValues("sessionFilterOptions");

const selectedTags =
getCheckedValues("tagsFilterOptions");

for(let day = 1; day <= daysInMonth; day++){

let totalR = 0;
let tradesCount = 0;

trades.forEach(trade => {

if(!trade.date) return;

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

if(
selectedTags.length > 0 &&
!(trade.tags && selectedTags.every(t => trade.tags && trade.tags.includes(t)))
){
return;
}

const tradeDate =
new Date(trade.date);

if(

tradeDate.getDate() === day &&

tradeDate.getMonth() === currentMonth &&

tradeDate.getFullYear() === currentYear

){

totalR += trade.resultR;
tradesCount++;

}

});

let colorClass =
totalR >= 0
?
"calendar-profit"
:
"calendar-loss";

let intensity =
Math.min(
Math.abs(totalR) * 15,
100
);

let bgColor =
totalR > 0
?
`rgba(34,197,94,${intensity/100})`
:
totalR < 0
?
`rgba(239,68,68,${intensity/100})`
:
"var(--bg-surface-2)";

// كي تكون الخلفية مشبعة (intensity عالية)، نبدلو لون النص لأبيض
// باش يبقى واضح، بدل ما يبقى نفس لون الخلفية (أخضر على أخضر
// أو أحمر على أحمر). نفس المنطق للربح والخسارة.
let valueColor =
intensity > 35
?
"#FFFFFF"
:
(
totalR > 0 ? "var(--success)" :
totalR < 0 ? "var(--danger)" :
"var(--text-tertiary)"
);

let valueShadow =
intensity > 35
?
"text-shadow:0 1px 3px rgba(0,0,0,0.35);"
:
"";

calendar.innerHTML += `

<div
class="calendar-cell"
style="background:${bgColor}"
onclick="openDayTrades(${day})"

onmousemove="
showTooltip(
event,
'${day}',
'${totalR.toFixed(1)}',
'${tradesCount}'
)
"

onmouseleave="
hideTooltip()
"
>

<div class="calendar-date">
${day}
</div>

<div style="color:${valueColor};font-weight:700;${valueShadow}">
${totalR.toFixed(1)}R
</div>

<div class="calendar-trades">
${tradesCount} Trades
</div>

</div>

`;

}

const totalCells =
firstDay + daysInMonth;

const remaining =
42 - totalCells;

for(let i = 0; i < remaining; i++){

calendar.innerHTML +=
`<div class="empty-cell"></div>`;

}

}

function nextMonth() {
    
    currentMonth++;
    
    if (currentMonth > 11) {
        
        currentMonth = 0;
        currentYear++;
        
    }
    
    renderCalendar();
    
}

function prevMonth() {
    
    currentMonth--;
    
    if (currentMonth < 0) {
        
        currentMonth = 11;
        currentYear--;
        
    }
    
    renderCalendar();
    
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

// نحدثو label الـ Custom Select لأن الخيارات (options) تبدلات
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
    
    const selectedTags =
        getCheckedValues("tagsFilterOptions");
    
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
            
            if (
                selectedTags.length > 0 &&
                !(trade.tags && selectedTags.every(t => trade.tags && trade.tags.includes(t)))
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

function renderModelsCards(){

const container =
document.getElementById(
"modelsContainer"
);

container.innerHTML = "";

modelsList.forEach(model=>{

const modelTrades =
trades.filter(
trade =>
trade.model === model
);

const totalTrades =
modelTrades.length;

const wins =
modelTrades.filter(
trade =>
trade.result === "Win"
).length;

const totalR =
modelTrades.reduce(
(sum,trade)=>
sum + trade.resultR,
0
);

const winRate =
totalTrades
?
((wins/totalTrades)*100)
.toFixed(0)
:
0;

container.innerHTML += `

<div class="model-card">

<h3>${model}</h3>

<div class="model-stat">
Trades: ${totalTrades}
</div>

<div class="model-stat">
Win Rate: ${winRate}%
</div>

<div class="model-stat">
Total R: ${totalR.toFixed(1)}
</div>

<div class="model-buttons">

<button
onclick="
window.location.href='model.html?name=${model}'
">
Open
</button>

<button
onclick="
toggleForm();
document.getElementById('model').value='${model}';
">
Add Trade
</button>

<button
class="model-btn-delete"
onclick="
deleteModel('${model}')
">
<i data-lucide="trash-2"></i>
</button>

</div>

</div>

`;

});

refreshIcons();

}

async function deleteModel(model){

const confirmDelete =
await customConfirm(
`Delete ${model} ?`
);

if(!confirmDelete) return;

modelsList =
modelsList.filter(
item => item !== model
);

localStorage.setItem(
"modelsList",
JSON.stringify(modelsList)
);
if (window.cloudSaveField) window.cloudSaveField("modelsList", modelsList);

renderModels();

renderModelsCards();

}

async function addModelPrompt(){

const modelName =
await customPrompt("Model Name");

if(!modelName) return;

if(
modelsList.includes(modelName)
){
await customAlert("Model already exists");
return;
}

modelsList.push(modelName);

localStorage.setItem(
"modelsList",
JSON.stringify(modelsList)
);
if (window.cloudSaveField) window.cloudSaveField("modelsList", modelsList);

renderModels();

renderModelsCards();

}

function showTooltip(
event,
day,
totalR,
trades
){

const tooltip =
document.getElementById(
"tooltip"
);

tooltip.style.display =
"block";

tooltip.style.left =
event.pageX + 15 + "px";

tooltip.style.top =
event.pageY + 15 + "px";

tooltip.innerHTML =

`
<b>Day ${day}</b><br>
R: ${totalR}<br>
Trades: ${trades}
`;

}

function hideTooltip(){

document.getElementById(
"tooltip"
).style.display =
"none";

}

function openDayTrades(day){

const dayTrades =
trades.filter(trade=>{

const d =
new Date(trade.date);

return (

d.getDate()===day &&

d.getMonth()===currentMonth &&

d.getFullYear()===currentYear

);

});

document.getElementById(
"dayTitle"
).textContent =
day +
"/" +
(currentMonth+1) +
"/" +
currentYear;

let html = "";

dayTrades.forEach(trade=>{

const index =
trades.indexOf(trade);

html += `

<div class="stat-card">

<p>
${trade.asset}
|
${trade.resultR}R
</p>

<button
onclick="
editTrade(${index})
"
>
Edit
</button>

<button
onclick="
deleteTrade(${index})
"
>
Delete
</button>

</div>

`;

});

document.getElementById(
"dayTrades"
).innerHTML =
html;

document.getElementById(
"dayModal"
).style.display =
"flex";

}

function exportJSON() {

    const scope = getExportScope();

    const exportData = {
        version: "1.0.0",
        exportDate: new Date().toISOString(),
        journalMetadata: {
            appName: "IxView Trading Journal",
            totalTrades: scope.trades.length,
            totalModels: scope.models.length,
            totalTags: scope.tags.length,
            scopedToModels: getCheckedValues("exportModelsOptions").length > 0 ? scope.models : "All"
        },
        trades: scope.trades,
        models: scope.models,
        tags: scope.tags,
        mistakes: scope.mistakes,
        emotions: scope.emotions,
        settings: {
            theme: localStorage.getItem("ixview-theme") || "dark"
        }
    };

    const data = JSON.stringify(exportData, null, 2);
    
    const blob = new Blob([data], {
        type: "application/json"
    });
    
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    
    document.body.appendChild(a);
    
    a.href = url;
    a.download = "ixview_export_" + new Date().toISOString().slice(0, 10) + ".json";
    
    a.click();
    
    document.body.removeChild(a);
    
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);
    
}
// دالة صغيرة كتدمج قائمة (models/tags/mistakes/emotions) بلا تكرار،
// وكترجع عدد العناصر الجداد لي تزادو فعليًا
function mergeUniqueList(existingList, incomingList) {
    let added = 0;
    (incomingList || []).forEach(item => {
        if (item && typeof item === "string" && !existingList.includes(item)) {
            existingList.push(item);
            added++;
        }
    });
    return added;
}

// كتحدث شريط التقدم ديال الاستيراد (نسبة + نص)، وكتخبيه تلقائيًا
// كي توصل لـ 100% بعد فترة قصيرة
function updateImportProgress(percent, text, autoHide) {
    const wrap = document.getElementById("importProgressWrap");
    const fill = document.getElementById("importProgressFill");
    const label = document.getElementById("importProgressText");
    if (!wrap || !fill || !label) return;
    wrap.style.display = "block";
    fill.style.width = percent + "%";
    label.textContent = text;
    if (autoHide) {
        setTimeout(function () {
            wrap.style.display = "none";
            fill.style.width = "0%";
        }, 1200);
    }
}

function importTrades(event) {
    
    const file =
        event.target.files[0];
    
    if (!file) return;

    updateImportProgress(20, "جاري قراءة الملف...", false);
    
    const reader =
        new FileReader();
    
    reader.onload = function(e) {
        
        try {

            updateImportProgress(60, "جاري دمج البيانات...", false);
            
            const parsed =
                JSON.parse(
                    e.target.result
                );

            // دعم صيغتين: القديمة (array من الصفقات بس) والجديدة
            // (object فيه trades/models/tags/mistakes/emotions)
            let importedTrades, importedModels, importedTags, importedMistakes, importedEmotions;

            if (Array.isArray(parsed)) {

                importedTrades = parsed;
                importedModels = [];
                importedTags = [];
                importedMistakes = [];
                importedEmotions = [];

            } else if (parsed && typeof parsed === "object" && Array.isArray(parsed.trades)) {

                importedTrades = parsed.trades;
                importedModels = Array.isArray(parsed.models) ? parsed.models : [];
                importedTags = Array.isArray(parsed.tags) ? parsed.tags : [];
                importedMistakes = Array.isArray(parsed.mistakes) ? parsed.mistakes : [];
                importedEmotions = Array.isArray(parsed.emotions) ? parsed.emotions : [];

            } else {
                throw new Error("Invalid format");
            }

            // ===== Merge Trades: فحص التكرار بالـ ID، إضافة الجديد فقط =====
            const existingIds = new Set(trades.map(t => t.id).filter(Boolean));
            let tradesAdded = 0;
            let tradesSkipped = 0;
            const newlyAddedTrades = [];

            importedTrades.forEach(t => {

                if (!t || typeof t !== "object") return;

                if (!t.id) {
                    t.id = window.generateTradeId ?
                        window.generateTradeId() :
                        ("trade_" + Date.now() + "_" + Math.random());
                }

                if (existingIds.has(t.id)) {
                    tradesSkipped++;
                    return;
                }

                if (typeof t.resultR !== "number" || !isFinite(t.resultR)) {
                    t.resultR = 0;
                }

                existingIds.add(t.id);
                trades.push(t);
                newlyAddedTrades.push(t);
                tradesAdded++;

            });

            // ===== Merge Models/Tags/Mistakes/Emotions: فحص بالاسم =====
            const modelsAdded = mergeUniqueList(modelsList, importedModels);
            const tagsAdded = mergeUniqueList(tagsList, importedTags);
            const mistakesAdded = mergeUniqueList(mistakesList, importedMistakes);
            const emotionsAdded = mergeUniqueList(emotionsList, importedEmotions);

            // ===== حفظ محلي =====
            localStorage.setItem("trades", JSON.stringify(trades));
            localStorage.setItem("modelsList", JSON.stringify(modelsList));
            localStorage.setItem("tagsList", JSON.stringify(tagsList));
            localStorage.setItem("mistakesList", JSON.stringify(mistakesList));
            localStorage.setItem("emotionsList", JSON.stringify(emotionsList));

            // ===== حفظ سحابي (غير العناصر الجداد، ماشي كل شي من جديد) =====
            if (newlyAddedTrades.length > 0 && window.cloudBulkSaveTrades) {
                window.cloudBulkSaveTrades(newlyAddedTrades);
            }
            if (modelsAdded > 0 && window.cloudSaveField) window.cloudSaveField("modelsList", modelsList);
            if (tagsAdded > 0 && window.cloudSaveField) window.cloudSaveField("tagsList", tagsList);
            if (mistakesAdded > 0 && window.cloudSaveField) window.cloudSaveField("mistakesList", mistakesList);
            if (emotionsAdded > 0 && window.cloudSaveField) window.cloudSaveField("emotionsList", emotionsList);

            // ===== تحديث الواجهة كاملة =====
            renderModels();
            renderModelsCards();
            renderMistakes();
            renderTagsList();
            renderEmotionsList();
            renderTrades();
            updateStats();
            drawChart();
            drawSessionChart();
            renderTagsStats();
            renderMistakeEmotionAnalytics();
            renderCalendar();

            updateImportProgress(100, "تم بنجاح ✓", true);

            // ===== تقرير النتائج =====
            if (window.showImportSummary) {
                window.showImportSummary({
                    tradesAdded: tradesAdded,
                    tradesSkipped: tradesSkipped,
                    modelsAdded: modelsAdded,
                    tagsAdded: tagsAdded,
                    mistakesAdded: mistakesAdded,
                    emotionsAdded: emotionsAdded,
                    errors: 0
                });
            } else {
                customAlert(tradesAdded + " Trades Added, " + tradesSkipped + " Duplicates Skipped");
            }
            
        } catch (err) {
            
            console.error("خطأ الاستيراد:", err);
            updateImportProgress(100, "فشل الاستيراد ✕", true);
            customAlert("ملف JSON غير صالح — تأكد أنو ملف تصدير IxView صحيح.");
            
        }
        
    };
    
    reader.readAsText(file);

    // نصفر قيمة input الملف باش يقدر يختار نفس الملف مرة أخرى إذا احتاج
    event.target.value = "";
    
}

// كتحمي القيمة من كسر بنية CSV إذا فيها فاصلة (,) أو اقتباس (") أو سطر جديد
function csvEscape(value) {
    if (value === undefined || value === null) return "";
    const str = Array.isArray(value) ? value.join("; ") : String(value);
    if (/[",\n]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function exportCSV() {
    
    const scope = getExportScope();

    const headers = [
        "Trade ID", "Date", "Asset", "Model", "Session", "Result",
        "Entry", "Stop Loss", "Take Profit", "R", "Risk %", "Lot Size",
        "Emotion", "Tags", "Mistakes", "Notes"
    ];

    let csv = headers.map(csvEscape).join(",") + "\n";
    
    scope.trades.forEach(trade => {
        
        const row = [
            trade.id || "",
            trade.date || "",
            trade.asset || "",
            trade.model || "",
            trade.session || "",
            trade.result || "",
            trade.entryPrice ?? "",
            trade.stopLoss ?? "",
            trade.takeProfit ?? "",
            trade.resultR ?? "",
            trade.risk ?? "",
            trade.lotSize ?? "",
            trade.emotion || "",
            trade.tags || "",
            trade.mistakes || "",
            trade.notes || ""
        ];

        csv += row.map(csvEscape).join(",") + "\n";
        
    });
    
    // BOM فأول الملف باش إكسل يقرا الحروف العربية صحيحة (UTF-8)
    const blob =
        new Blob(
            ["\uFEFF" + csv],
            {
                type: "text/csv;charset=utf-8;"
            }
        );
    
    const link =
        document.createElement("a");
    
    link.href =
        URL.createObjectURL(blob);
    
    link.download =
        "ixview_trades_" + new Date().toISOString().slice(0, 10) + ".csv";
    
    document.body.appendChild(link);
    
    link.click();
    
    document.body.removeChild(link);
    
}
// نحمّلو مكتبات PDF (jsPDF + autotable + html2canvas) غير أول مرة كيضغط
// المستخدم على "تصدير PDF"، باش ما تبطأش الصفحة عند أول فتح
let _pdfLibsLoaded = false;
function loadPDFLibraries() {
    if (_pdfLibsLoaded) return Promise.resolve();

    const scripts = [
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"
    ];

    const loadOne = (src) => new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });

    // خاصهم يتحملو بالترتيب (autotable محتاج jsPDF قبلو)
    return scripts.reduce(
        (p, src) => p.then(() => loadOne(src)),
        Promise.resolve()
    ).then(() => { _pdfLibsLoaded = true; });
}

async function exportPDF(){

if (!_pdfLibsLoaded) {
    const btn = document.activeElement;
    if (btn && btn.tagName === "BUTTON") btn.textContent = "جاري التحميل...";
    try {
        await loadPDFLibraries();
    } catch (err) {
        console.error("تعذر تحميل مكتبات PDF:", err);
        customAlert("تعذر تحميل أدوات تصدير PDF، تحقق من الاتصال بالإنترنت.");
        return;
    } finally {
        if (btn && btn.tagName === "BUTTON") btn.textContent = "Export PDF";
    }
}

const { jsPDF } = window.jspdf;

const doc = new jsPDF("p","mm","a4");

const pageWidth =
doc.internal.pageSize.getWidth();

const pageHeight =
doc.internal.pageSize.getHeight();

// نستعملو النطاق المفلتر حسب الموديلات المختارة فـ Export Modal
// (إذا ما تختارش موديل، pdfTrades = كل الصفقات، بحال قبل)
const exportScope = getExportScope();
const pdfTrades = exportScope.trades;

const wins =
pdfTrades.filter(t=>t.result==="Win").length;

const losses =
pdfTrades.filter(t=>t.result==="Loss").length;

const be =
pdfTrades.filter(t=>t.result==="Breakeven").length;

const totalR =
pdfTrades.reduce((s,t)=>s+(t.resultR||0),0);

const winRate =
pdfTrades.length
?
((wins/pdfTrades.length)*100).toFixed(1)
:
0;

const avgR =
pdfTrades.length
?
(totalR/pdfTrades.length).toFixed(2)
:
0;

const bestTrade =
pdfTrades.length ?
Math.max(...pdfTrades.map(t => t.resultR || 0)) :
0;

const worstTrade =
pdfTrades.length ?
Math.min(...pdfTrades.map(t => t.resultR || 0)) :
0;

/* COVER */

doc.setFillColor(109, 93, 252); /* هوية IxView: #6D5DFC */

doc.rect(
0,
0,
210,
297,
"F"
);

doc.setTextColor(255,255,255);

doc.setFontSize(28);

doc.text(
    "IxView Trading Journal",
    pageWidth / 2,
    55,
    {
        align: "center"
    }
);

doc.setFontSize(16);

doc.text(
    "Performance Report",
    pageWidth / 2,
    68,
    {
        align: "center"
    }
);

doc.setFontSize(12);

doc.text(
"Export Date: " + new Date().toLocaleDateString(),
pageWidth/2,
85,
{
align:"center"
}
);

doc.text(
"Total Trades: " + trades.length + "   |   Win Rate: " + winRate + "%   |   Average RR: " + avgR,
pageWidth/2,
95,
{
align:"center"
}
);

/* PAGE 2 */

doc.addPage();

doc.setFillColor(109, 93, 252);
doc.rect(0, 0, 210, 22, "F");

doc.setTextColor(255,255,255);

doc.setFontSize(16);

doc.text(
"Performance Overview",
10,
14
);

doc.setTextColor(0,0,0);

const cards = [

["Trades", trades.length],
["Win Rate", winRate+"%"],
["Total R", totalR.toFixed(1)],
["Average R", avgR],
["Wins", wins],
["Losses", losses],
["Breakeven", be],
["Best Trade", bestTrade.toFixed(1)],
["Worst Trade", worstTrade.toFixed(1)]

];

let x = 10;
let y = 30;

cards.forEach((card,index)=>{

doc.setFillColor(245,245,245);

doc.roundedRect(
x,
y,
58,
25,
3,
3,
"F"
);

doc.setFontSize(9);

doc.text(
card[0],
x+4,
y+8
);

doc.setFontSize(15);

// نلونو القيمة: أخضر للأرباح، أحمر للخسائر، بنفسجي (هوية الموقع) للباقي
if (card[0] === "Wins" || card[0] === "Best Trade" || (card[0] === "Total R" && totalR > 0) || (card[0] === "Average R" && avgR > 0)) {
    doc.setTextColor(34, 197, 94); /* أخضر */
} else if (card[0] === "Losses" || card[0] === "Worst Trade" || (card[0] === "Total R" && totalR < 0) || (card[0] === "Average R" && avgR < 0)) {
    doc.setTextColor(239, 68, 68); /* أحمر */
} else {
    doc.setTextColor(109, 93, 252); /* بنفسجي هوية الموقع */
}

doc.text(
String(card[1]),
x+4,
y+18
);

doc.setTextColor(0,0,0);

x += 65;

if((index+1)%3===0){

x = 10;

y += 32;

}

});

/* EQUITY */

// كنبنيو Equity Curve مخصوصة لـ pdfTrades (النطاق المختار للتصدير)
// بدل ما نقراو الرسم الحي فالصفحة، لأن هادشاك كيعكس فلاتر الداشبورد
// الحالية وماشي بالضرورة نفس الموديلات المختارة هنا فالتصدير
const sortedPdfTrades =
[...pdfTrades].sort((a, b) => new Date(a.date) - new Date(b.date));

let pdfDates = [];
let pdfEquity = [];
let pdfTotal = 0;

sortedPdfTrades.forEach(t => {
    pdfTotal += (t.resultR || 0);
    pdfDates.push(t.date ? new Date(t.date).toLocaleDateString() : "");
    pdfEquity.push(pdfTotal);
});

const equityCanvas = document.createElement("canvas");
equityCanvas.width = 900;
equityCanvas.height = 360;
const equityChartTemp = new Chart(equityCanvas, {
    type: "line",
    data: {
        labels: pdfDates,
        datasets: [{
            label: "Equity Curve",
            data: pdfEquity,
            tension: 0.4,
            fill: true,
            borderWidth: 3,
            pointRadius: 2,
            borderColor: "#6D5DFC",
            backgroundColor: "#6D5DFC22"
        }]
    },
    options: {
        responsive: false,
        animation: false,
        plugins: { legend: { display: false } }
    }
});
const equityImage = equityCanvas.toDataURL("image/png");
equityChartTemp.destroy();

doc.setTextColor(109, 93, 252);
doc.setFontSize(16);

doc.text(
"Equity Curve",
10,
128
);

doc.setTextColor(0,0,0);

doc.addImage(
equityImage,
"PNG",
10,
135,
190,
70
);

/* PAGE 3 */

doc.addPage();

doc.setFillColor(109, 93, 252);
doc.rect(0, 0, 210, 22, "F");

doc.setTextColor(255,255,255);

doc.setFontSize(16);

doc.text(
"Session Analysis & Win/Loss Distribution",
10,
14
);

doc.setTextColor(0,0,0);

// Session Breakdown: كنبنيوها من pdfTrades (النطاق المختار للتصدير)
// بدل قراءة الرسم الحي (لي كيعكس فلاتر الداشبورد الحالية)
const pdfSessions = { "Asia": 0, "London": 0, "New York AM": 0, "New York PM": 0 };
pdfTrades.forEach(t => {
    if (t.session && pdfSessions.hasOwnProperty(t.session)) pdfSessions[t.session]++;
});

const sessionCanvas = document.createElement("canvas");
sessionCanvas.width = 400;
sessionCanvas.height = 400;
const sessionChartTemp = new Chart(sessionCanvas, {
    type: "doughnut",
    data: {
        labels: Object.keys(pdfSessions),
        datasets: [{
            data: Object.values(pdfSessions),
            backgroundColor: ["#6D5DFC", "#8578FF", "#5647E8", "#D9D0C2"],
            borderWidth: 0
        }]
    },
    options: {
        responsive: false,
        animation: false,
        plugins: { legend: { position: "bottom", labels: { font: { size: 18 } } } }
    }
});
const sessionImage = sessionCanvas.toDataURL("image/png");
sessionChartTemp.destroy();

doc.setFontSize(12);
doc.text("Session Breakdown", 15, 34);

doc.addImage(
sessionImage,
"PNG",
15,
38,
80,
80
);

// Win/Loss Distribution: كنبنيوها بـ Chart.js فـ canvas مؤقت (خارج
// الشاشة) خاص بالتصدير فقط، ماشي جزء من الواجهة العادية
const winLossCanvas = document.createElement("canvas");
winLossCanvas.width = 400;
winLossCanvas.height = 400;
const winLossChart = new Chart(winLossCanvas, {
    type: "doughnut",
    data: {
        labels: ["Wins", "Losses", "Breakeven"],
        datasets: [{
            data: [wins, losses, be],
            backgroundColor: ["#22C55E", "#EF4444", "#F59E0B"],
            borderWidth: 0
        }]
    },
    options: {
        responsive: false,
        animation: false,
        plugins: {
            legend: {
                position: "bottom",
                labels: { font: { size: 20 } }
            }
        }
    }
});

const winLossImage = winLossCanvas.toDataURL("image/png");
winLossChart.destroy();

doc.setFontSize(12);
doc.text("Win / Loss Distribution", 110, 34);

doc.addImage(
winLossImage,
"PNG",
110,
38,
80,
80
);

/* TABLE */

const rows =
pdfTrades.map(t=>[
t.asset,
t.model,
t.session,
t.result,
t.resultR,
(t.date||"").substring(0,10)
]);

doc.autoTable({

startY:130,

head:[[
"Asset",
"Model",
"Session",
"Result",
"R",
"Date"
]],

body:rows,

theme:"grid",

headStyles:{
fillColor:[109, 93, 252]
},

styles:{
fontSize:8
},

// نلونو خانة Result حسب النتيجة (أخضر=Win، أحمر=Loss، برتقالي=Breakeven)
didParseCell: function (data) {
    if (data.section === "body" && data.column.index === 3) {
        const value = data.cell.raw;
        if (value === "Win") {
            data.cell.styles.textColor = [34, 197, 94];
            data.cell.styles.fontStyle = "bold";
        } else if (value === "Loss") {
            data.cell.styles.textColor = [239, 68, 68];
            data.cell.styles.fontStyle = "bold";
        } else if (value === "Breakeven") {
            data.cell.styles.textColor = [217, 119, 6];
            data.cell.styles.fontStyle = "bold";
        }
    }
}

});

/* FOOTER */

const pages =
doc.getNumberOfPages();

for(let i=1;i<=pages;i++){

doc.setPage(i);

doc.setFontSize(9);

doc.setTextColor(120);

doc.text(
`Page ${i} / ${pages}`,
pageWidth/2,
290,
{
align:"center"
}
);

}

doc.save(
    "Trading_Journal_Report.pdf"
);

}

// ملاحظة: كانت هنا دالة handleExport() قديمة كتعتمد على عنصر
// "exportType" ما كانش موجود حتى فالنسخة الأصلية للموقع (dead code،
// كانت غادي ترمي error لو تستدعات). وظيفتها مغطاة كاملة بأزرار
// Modal ديال Export/Import (كل زر عندو onclick مباشر لـ exportPDF/exportCSV/...).
// تحذفات هنا.

function openExportImportModal(){

document.getElementById(
"exportImportModal"
).style.display =
"flex";

renderExportModelsOptions();
refreshIcons();

}

// كتبني checkboxes قائمة "Models to Export" من modelsList
function renderExportModelsOptions() {
    const container = document.getElementById("exportModelsOptions");
    if (!container) return;
    const previouslyChecked = getCheckedValues("exportModelsOptions");
    container.innerHTML = "";
    modelsList.forEach(function (model) {
        const label = document.createElement("label");
        label.innerHTML =
            '<input type="checkbox" value="' + model + '" ' +
            (previouslyChecked.includes(model) ? "checked " : "") +
            'onchange="updateExportModelsLabel()"> ' + model;
        container.appendChild(label);
    });
    updateExportModelsLabel();
}

function updateExportModelsLabel() {
    const selected = getCheckedValues("exportModelsOptions");
    const labelEl = document.getElementById("exportModelsLabel");
    if (!labelEl) return;
    labelEl.textContent =
        selected.length === 0 ? "All Models (Full Export)" :
        selected.length === 1 ? selected[0] :
        selected.length + " Models Selected";
}

// كتحسب البيانات لي غادي تتصدر: إذا ما تختارش موديل، كلشي (بحال قبل).
// إذا تختارو موديل ولا أكثر، غير صفقات هاد الموديلات + التاكات/الحالات/
// الأخطاء لي فعليًا مستعملة فهاد الصفقات (ماشي القوائم الكاملة)
function getExportScope() {
    const selectedModels = getCheckedValues("exportModelsOptions");

    if (selectedModels.length === 0) {
        return {
            trades: trades,
            models: modelsList,
            tags: tagsList,
            mistakes: mistakesList,
            emotions: emotionsList
        };
    }

    const scopedTrades = trades.filter(t => selectedModels.includes(t.model));

    const usedTags = new Set();
    const usedMistakes = new Set();
    const usedEmotions = new Set();

    scopedTrades.forEach(t => {
        (t.tags || []).forEach(x => usedTags.add(x));
        (t.mistakes || []).forEach(x => usedMistakes.add(x));
        (Array.isArray(t.emotion) ? t.emotion : (t.emotion ? [t.emotion] : [])).forEach(x => usedEmotions.add(x));
    });

    return {
        trades: scopedTrades,
        models: selectedModels,
        tags: Array.from(usedTags),
        mistakes: Array.from(usedMistakes),
        emotions: Array.from(usedEmotions)
    };
}

function closeExportImportModal(){

document.getElementById(
"exportImportModal"
).style.display =
"none";

}

document.addEventListener(
"click",
function(e){

// نسدو قوائم الفلاتر المتعددة (Asset/Session) كي المستخدم يضغط برا منهم
document.querySelectorAll(".filter-dropdown").forEach(function (dropdown) {
    if (!dropdown.contains(e.target)) {
        const filterMenu = dropdown.querySelector(".filter-menu");
        if (filterMenu) filterMenu.style.display = "none";
    }
});

}
);


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

renderModels();
renderModelsCards();
renderMistakes();
renderTagsList();
renderEmotionsList();
renderTrades();
updateStats();
drawChart();
drawSessionChart();
renderTagsStats();
renderMistakeEmotionAnalytics();
renderCalendar();




window.addEventListener("cloudDataReady", function () {

    trades = sanitizeTrades(JSON.parse(localStorage.getItem("trades")) || []);
    modelsList = JSON.parse(localStorage.getItem("modelsList")) || modelsList;
    mistakesList = JSON.parse(localStorage.getItem("mistakesList")) || mistakesList;
    tagsList = JSON.parse(localStorage.getItem("tagsList")) || tagsList;
    emotionsList = JSON.parse(localStorage.getItem("emotionsList")) || emotionsList;

    renderModels();
    renderModelsCards();
    renderMistakes();
    renderTagsList();
    renderEmotionsList();
    renderTrades();
    updateStats();
    drawChart();
    drawSessionChart();
    renderTagsStats();
    renderMistakeEmotionAnalytics();
    renderCalendar();

});

// عند تبديل الثيم (Dark/Light)، الرسوم البيانية (Chart.js) ما كتبدلش
// ألوانها تلقائيًا لأن الألوان كتتقرأ مرة وحدة وقت الرسم، فخاصنا نعاودو
// نرسموها من جديد باش تاخد ألوان الثيم الجديد
window.addEventListener("themeChanged", function () {
    drawChart();
    drawSessionChart();
});

// ===================== Drag & Drop للاستيراد =====================
// كتسمح للمستخدم يسحب ملف JSON مباشرة لمنطقة الاستيراد بدل ما يدور عليه
(function setupImportDropzone() {
    const dropzone = document.getElementById("importDropzone");
    if (!dropzone) return;

    ["dragenter", "dragover"].forEach(function (evt) {
        dropzone.addEventListener(evt, function (e) {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add("dragover");
        });
    });

    ["dragleave", "drop"].forEach(function (evt) {
        dropzone.addEventListener(evt, function (e) {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove("dragover");
        });
    });

    dropzone.addEventListener("drop", function (e) {
        const file = e.dataTransfer && e.dataTransfer.files ? e.dataTransfer.files[0] : null;
        if (!file) return;
        if (!file.name.toLowerCase().endsWith(".json")) {
            customAlert("خاصك تختار ملف بصيغة JSON فقط.");
            return;
        }
        // كنبنيو "event" مزيف بنفس الشكل لي كتوقعو importTrades()
        importTrades({ target: { files: [file], value: "" } });
    });
})();

