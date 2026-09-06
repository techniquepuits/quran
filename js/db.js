// ==========================================
// ملف واجهات المستخدم (db_3.js) - إضافة زر "مواصلة" للنافذة المنبثقة
// ==========================================

let currentReviewItem = null; 
let targetAyahTextCache = ""; 

let currentProgressIndex = 1;
let totalDailyTargetCount = 8;
let isDarkMode = false;

// متغيرات خاصة بجلسة المراجعة الخاصة (المقطع الكامل)
let selectedSpecialSurah = null;
let specialStartAyah = 1;
let specialEndAyah = 1;

let mediaRecorder = null;
let audioChunks = [];
let recordedAudioBlob = null;
let recordedAudioUrl = null;
let playbackAudioElement = null;
let isRecording = false;
let isRecordingPaused = false;
let isPlayingRecording = false;

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    
    const darkBtn = document.getElementById('dark-mode-btn');
    if (darkBtn) {
        darkBtn.innerText = isDarkMode ? '☀️' : '🌙';
        darkBtn.title = isDarkMode ? 'الوضع العادي' : 'الوضع الليلي';
    }
}

function getFromMemory(recordKey, i, j, k) {
    let data;
    if (recordKey === "ayah_statuses.json") data = memoryQuranStatuses;
    else if (recordKey === "ayah_texts.json") data = memoryQuranTexts;
    else return null;

    const propertyName = recordKey.replace('.json', '');
    const targetArray = data[propertyName] || data;
    return targetArray[i]?.[j]?.[k];
}

// ==========================================
// 1. مراجعة آية بآية (المراجعة اليومية)
// ==========================================
function showReviewScreen() {
    const reviewScreenHTML = `
        <div class="header-box">
            <div style="display: flex; gap: 6px; align-items: center;">
                <button class="btn-home" onclick="showMainButtons()" title="العودة للقائمة الرئيسية">🏠 القائمة</button>
                <button id="dark-mode-btn" class="btn-home" onclick="toggleDarkMode()" title="${isDarkMode ? 'الوضع العادي' : 'الوضع الليلي'}">${isDarkMode ? '☀️' : '🌙'}</button>
            </div>
            <div id="daily-progress-badge" style="background: #f1f5f9; border: 1.5px solid #cbd5e1; padding: 4px 12px; border-radius: 8px; font-weight: bold; color: #1b4d3e; font-size: 15px;">
                1 / 8
            </div>
            <div id="surah-name" class="surah-title" style="font-size: 16px;">سورة: ---</div>
        </div>

        <div class="exercise-box" id="exercise-container">
            <button class="expand-arc-btn" onclick="expandContext()" title="إظهار الآية السابقة للمساعدة">&#8593;</button>
            <button id="play-ayah-audio-btn" onclick="playCurrentTargetAyahAudio()" class="audio-btn">🔊</button>
            <audio id="ayah-audio-element" class="hidden"></audio>

            <div class="continuous-quran-text">
                <span id="prev-ayahs-container"></span>
                <span id="prompt-ayah" class="ayah-blue">جاري تحميل الآية المفعلة...</span>
                <span class="circle-num" id="prompt-num"></span>

                <span id="target-blank-1" class="blank-space" style="visibility: hidden;"></span>
                <span class="circle-num" id="target-num-1"></span>

                <span id="target-blank-2" class="blank-space-gray" style="visibility: hidden;"></span>
            </div>
        </div>
        
        <div id="action-area">
            <div class="action-top-row">
                <button id="record-action-btn" class="btn-recording" onclick="handleDailyRecordingToggle()">🎙️ تسجيل</button>
                <button id="sheikh-audio-btn" class="btn-audio-sheikh hidden" onclick="handleSheikhAudioPlaceholder()">🔊 الآية بصوت الشيخ</button>
            </div>
            <button id="show-btn" class="btn-main" onclick="revealDailyAnswer()">عرض الإجابة</button>
        </div>

        <div id="rating-area" class="rating-buttons hidden">
            <button class="btn-rate btn-forgot" onclick="nextDailyQuestion('forgot')">نسيت</button>
            <button class="btn-rate btn-hard" onclick="nextDailyQuestion('hard')">صعب</button>
            <button class="btn-rate btn-good" onclick="nextDailyQuestion('good')">جيد</button>
            <button class="btn-rate btn-easy" onclick="nextDailyQuestion('easy')">سهل</button>
        </div>
    `;
    
    renderInContainer(reviewScreenHTML);
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
    loadRandomActiveAyahToReview();
}

function loadRandomActiveAyahToReview() {
    resetRecordingStates();

    if (typeof userCountLearningPlannedToday !== 'undefined') {
        totalDailyTargetCount = userCountLearningPlannedToday;
    }

    const badgeEl = document.getElementById('daily-progress-badge');
    if (badgeEl) {
        badgeEl.innerText = `${currentProgressIndex} / ${totalDailyTargetCount}`;
    }

    const showBtn = document.getElementById('show-btn');
    const ratingArea = document.getElementById('rating-area');
    const sheikhBtn = document.getElementById('sheikh-audio-btn');
    
    if (showBtn) showBtn.classList.remove('hidden');
    if (ratingArea) ratingArea.classList.add('hidden');
    if (sheikhBtn) sheikhBtn.classList.add('hidden');

    const currentRiwaya = typeof userRiwaya !== 'undefined' ? userRiwaya : 0;
    const activeAyahsCoords = [];
    const promptAyahEl = document.getElementById('prompt-ayah');

    if (promptAyahEl) promptAyahEl.innerText = "جاري اختيار الآية...";

    const prevAyahsContainer = document.getElementById('prev-ayahs-container');
    if (prevAyahsContainer) prevAyahsContainer.innerHTML = ""; 

    const blank1 = document.getElementById('target-blank-1');
    const targetNum1El = document.getElementById('target-num-1');
    const targetBlank2 = document.getElementById('target-blank-2');

    if (targetBlank2) {
        targetBlank2.style.visibility = 'hidden';
        targetBlank2.innerText = "";
    }

    if (blank1) {
        blank1.style.visibility = 'hidden';
        blank1.innerText = "";
        blank1.classList.remove('ayah-green');
    }
    if (targetNum1El) targetNum1El.innerText = "";

    if (typeof surahsNames !== 'undefined' && typeof ayatCount !== 'undefined') {
        const totalSurahs = surahsNames.length;
        for (let s = 0; s < totalSurahs; s++) {
            const maxA = ayatCount[currentRiwaya] ? ayatCount[currentRiwaya][s] : 7;
            for (let a = 0; a < maxA; a++) {
                try {
                    const status = getFromMemory("ayah_statuses.json", currentRiwaya, s, a);
                    if (status === 1 && (a + 1 < maxA)) {
                        activeAyahsCoords.push({ riwaya: currentRiwaya, surah: s, ayah: a });
                    }
                } catch (err) {}
            }
        }
    }

    if (activeAyahsCoords.length === 0) {
        if (promptAyahEl) promptAyahEl.innerText = "لا توجد آيات مفعلة كافية.";
        return;
    }

    const randomIndex = Math.floor(Math.random() * activeAyahsCoords.length);
    const targetCoord = activeAyahsCoords[randomIndex];
    currentReviewItem = targetCoord;

    try {
        const ayahText = getFromMemory("ayah_texts.json", targetCoord.riwaya, targetCoord.surah, targetCoord.ayah);
        if (promptAyahEl) promptAyahEl.innerText = ayahText || "تعذر جلب نص الآية.";
    } catch (e) {
        if (promptAyahEl) promptAyahEl.innerText = "خطأ في جلب النص.";
    }

    const promptNumEl = document.getElementById('prompt-num');
    if (promptNumEl) promptNumEl.innerText = targetCoord.ayah + 1;

    const surahNameEl = document.getElementById('surah-name');
    if (surahNameEl && typeof surahsNames !== 'undefined') {
        surahNameEl.innerText = `سورة: ${surahsNames[targetCoord.surah]}`;
    }

    const maxCurrentSurahAyats = ayatCount[currentRiwaya][targetCoord.surah];

    if (targetCoord.ayah + 1 < maxCurrentSurahAyats) {
        try {
            const nextFullAyahText = getFromMemory("ayah_texts.json", targetCoord.riwaya, targetCoord.surah, targetCoord.ayah + 1);
            targetAyahTextCache = nextFullAyahText || "";
            if (blank1) blank1.innerText = targetAyahTextCache;
            if (targetNum1El) targetNum1El.innerText = targetCoord.ayah + 2;
        } catch (e) {
            targetAyahTextCache = "تعذر جلب الآية المستهدفة.";
        }
    }

    if (targetCoord.ayah + 2 < maxCurrentSurahAyats) {
        try {
            const thirdAyahText = getFromMemory("ayah_texts.json", targetCoord.riwaya, targetCoord.surah, targetCoord.ayah + 2);
            if (thirdAyahText) {
                const nextThreeWords = thirdAyahText.split(" ").slice(0, 3).join(" ");
                if (targetBlank2) targetBlank2.innerText = nextThreeWords + " ...";
            }
        } catch (e) {
            if (targetBlank2) targetBlank2.innerText = "...";
        }
    } else {
        if (targetBlank2) targetBlank2.innerText = "نهاية السورة...";
    }
}

function revealDailyAnswer() {
    if (isRecording && mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        isRecording = false;
        isRecordingPaused = false;
    }

    const blank1 = document.getElementById('target-blank-1');
    const blank2 = document.getElementById('target-blank-2');
    if (blank1) {
        blank1.style.visibility = 'visible';
        blank1.classList.add('ayah-green'); 
    }
    if (blank2) {
        blank2.style.visibility = 'visible';
    }

    const showBtn = document.getElementById('show-btn');
    const ratingArea = document.getElementById('rating-area');
    const sheikhBtn = document.getElementById('sheikh-audio-btn');

    if (showBtn) showBtn.classList.add('hidden');
    if (ratingArea) ratingArea.classList.remove('hidden');
    if (sheikhBtn) sheikhBtn.classList.remove('hidden');

    const recordBtn = document.getElementById('record-action-btn');
    if (recordBtn) {
        recordBtn.innerText = "▶️ عرض التسجيل";
        recordBtn.className = "btn-recording";
    }
}

function handleDailyRecordingToggle() {
    const recordBtn = document.getElementById('record-action-btn');
    const showBtn = document.getElementById('show-btn');
    const isAnswerRevealed = showBtn && showBtn.classList.contains('hidden');

    if (isAnswerRevealed) {
        togglePlaybackRecordedAudio(recordBtn);
    } else {
        toggleRecordUserVoice(recordBtn);
    }
}

function nextDailyQuestion(ratingType) { 
    currentProgressIndex++;
    if (currentProgressIndex > totalDailyTargetCount) {
        currentProgressIndex = 1; 
    }
    loadRandomActiveAyahToReview(); 
}


// ==========================================
// 2. الجلسة الخاصة (مع أزرار التفاعل وزر المواصلة)
// ==========================================
function showSpecialSessionScreen() {
    selectedSpecialSurah = null;
    
    let surahsHtml = '';
    if (typeof surahsNames !== 'undefined') {
        surahsNames.forEach((name, index) => {
            surahsHtml += `
                <div class="setting-row-box" style="margin-bottom: 6px; padding: 6px 12px; display: flex; align-items: center; justify-content: space-between;">
                    <label class="radio-label" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                        <input type="radio" name="special-surah-radio" value="${index}" onchange="selectSpecialSurah(${index})">
                        <span>سورة ${name}</span>
                    </label>
                    <div id="range-box-${index}" class="hidden" style="display: flex; gap: 8px; align-items: center;">
                        <span style="font-size: 13px; font-weight: bold;">من:</span>
                        <input type="number" id="special-start-${index}" min="1" value="1" style="width: 50px; padding: 2px; text-align: center; border-radius: 4px; border: 1px solid #cbd5e1;" onchange="validateSpecialInputs(${index})">
                        <span style="font-size: 13px; font-weight: bold;">إلى:</span>
                        <input type="number" id="special-end-${index}" min="1" value="1" style="width: 50px; padding: 2px; text-align: center; border-radius: 4px; border: 1px solid #cbd5e1;" onchange="validateSpecialInputs(${index})">
                    </div>
                </div>
            `;
        });
    }

    const specialScreenHTML = `
        <div class="header-box">
            <div style="display: flex; gap: 6px; align-items: center;">
                <button class="btn-home" onclick="showMainButtons()" title="العودة للقائمة الرئيسية">🏠 القائمة</button>
                <button id="dark-mode-btn" class="btn-home" onclick="toggleDarkMode()" title="${isDarkMode ? 'الوضع العادي' : 'الوضع الليلي'}">${isDarkMode ? '☀️' : '🌙'}</button>
            </div>
            <div id="daily-progress-badge" style="background: #f1f5f9; border: 1.5px solid #cbd5e1; padding: 4px 12px; border-radius: 8px; font-weight: bold; color: #1b4d3e; font-size: 15px;">
                جلسة خاصة
            </div>
            <div id="surah-name" class="surah-title" style="font-size: 16px;">اختر سورة</div>
        </div>

        <div class="exercise-box" id="exercise-container" style="display: flex; flex-direction: column; gap: 8px;">
            <div style="font-weight: bold; font-size: 15px; color: #1b4d3e; text-align: right;">اختر السورة ونطاق الآيات:</div>
            <div class="surah-list-container" style="max-height: 220px;">
                ${surahsHtml}
            </div>

            <button id="start-special-btn" class="btn-main hidden" style="margin-top: 8px; max-width: 100%; padding: 10px;" onclick="initiateSpecialSessionExecution()">ابدأ الجلسة الخاصة</button>
        </div>
        
        <div id="action-area">
            <div class="action-top-row">
                <button id="record-action-btn" class="btn-recording" disabled>🎙️ تسجيل</button>
                <button id="sheikh-audio-btn" class="btn-audio-sheikh hidden" onclick="handleSheikhAudioPlaceholder()">🔊 الآية بصوت الشيخ</button>
            </div>
            <button id="show-btn" class="btn-main" disabled style="opacity: 0.6;">عرض الإجابة</button>
        </div>

        <div id="rating-area" class="rating-buttons hidden">
            <button class="btn-rate btn-forgot" onclick="nextSpecialQuestion('forgot')">نسيت</button>
            <button class="btn-rate btn-hard" onclick="nextSpecialQuestion('hard')">صعب</button>
            <button class="btn-rate btn-good" onclick="nextSpecialQuestion('good')">جيد</button>
            <button class="btn-rate btn-easy" onclick="nextSpecialQuestion('easy')">سهل</button>
        </div>
    `;

    renderInContainer(specialScreenHTML);
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
}

function selectSpecialSurah(surahIndex) {
    if (typeof surahsNames !== 'undefined') {
        surahsNames.forEach((_, idx) => {
            const box = document.getElementById(`range-box-${idx}`);
            if (box) {
                if (idx === surahIndex) {
                    box.classList.remove('hidden');
                } else {
                    box.classList.add('hidden');
                }
            }
        });
    }

    selectedSpecialSurah = surahIndex;
    const currentRiwaya = typeof userRiwaya !== 'undefined' ? userRiwaya : 0;
    const maxAyats = ayatCount && ayatCount[currentRiwaya] ? ayatCount[currentRiwaya][surahIndex] : 7;

    const startInput = document.getElementById(`special-start-${surahIndex}`);
    const endInput = document.getElementById(`special-end-${surahIndex}`);
    const startBtn = document.getElementById('start-special-btn');

    if (startBtn) startBtn.classList.remove('hidden');

    if (startInput) {
        startInput.value = 1;
        startInput.max = maxAyats;
    }
    if (endInput) {
        endInput.value = maxAyats;
        endInput.max = maxAyats;
    }

    specialStartAyah = 1;
    specialEndAyah = maxAyats;
}

function validateSpecialInputs(surahIndex) {
    const currentRiwaya = typeof userRiwaya !== 'undefined' ? userRiwaya : 0;
    const maxAyats = ayatCount[currentRiwaya][surahIndex];

    const startInput = document.getElementById(`special-start-${surahIndex}`);
    const endInput = document.getElementById(`special-end-${surahIndex}`);

    let valStart = parseInt(startInput.value) || 1;
    let valEnd = parseInt(endInput.value) || 1;

    if (valStart < 1) valStart = 1;
    if (valStart > maxAyats) valStart = maxAyats;
    startInput.value = valStart;

    if (valEnd < valStart) valEnd = valStart;
    if (valEnd > maxAyats) valEnd = maxAyats;
    endInput.value = valEnd;

    specialStartAyah = valStart;
    specialEndAyah = valEnd;
}

function initiateSpecialSessionExecution() {
    if (selectedSpecialSurah === null) return;
    validateSpecialInputs(selectedSpecialSurah);
    loadSpecialFullSectionExercise();
}

function loadSpecialFullSectionExercise() {
    resetRecordingStates();

    const currentRiwaya = typeof userRiwaya !== 'undefined' ? userRiwaya : 0;

    const showBtn = document.getElementById('show-btn');
    const ratingArea = document.getElementById('rating-area');
    const sheikhBtn = document.getElementById('sheikh-audio-btn');
    const recordBtn = document.getElementById('record-action-btn');

    if (showBtn) {
        showBtn.classList.remove('hidden');
        showBtn.removeAttribute('disabled');
        showBtn.style.opacity = '1';
        showBtn.setAttribute('onclick', 'revealSpecialFullAnswer()');
    }
    if (ratingArea) ratingArea.classList.add('hidden');
    if (sheikhBtn) sheikhBtn.classList.add('hidden');
    if (recordBtn) {
        recordBtn.removeAttribute('disabled');
        recordBtn.innerText = "🎙️ تسجيل";
        recordBtn.className = "btn-recording";
        recordBtn.setAttribute('onclick', 'handleSpecialRecordingToggle()');
    }

    const exerciseContainer = document.getElementById('exercise-container');
    
    let promptText = "";
    let promptNumDisplay = "";

    if (specialStartAyah === 1) {
        promptText = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
        promptNumDisplay = "";
    } else {
        const prevIdx = specialStartAyah - 2;
        promptText = getFromMemory("ayah_texts.json", currentRiwaya, selectedSpecialSurah, prevIdx) || "";
        promptNumDisplay = prevIdx + 1;
    }

    let fullTargetHTML = "";
    for (let a = specialStartAyah - 1; a < specialEndAyah; a++) {
        const text = getFromMemory("ayah_texts.json", currentRiwaya, selectedSpecialSurah, a) || "";
        const num = a + 1;
        fullTargetHTML += `
            <span id="special-ayah-item-${a}" 
                  onclick="handleSpecialAyahClick(${a})" 
                  style="cursor: pointer; padding: 2px 4px; border-radius: 4px; transition: background 0.2s;">
                ${text} <span class="circle-num">${num}</span>
            </span> `;
    }

    const customLayoutHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 10px;">
            <span style="font-size: 14px; font-weight: bold; color: #2d6a4f;">مقطع من الآية ${specialStartAyah} إلى ${specialEndAyah}</span>
            <span class="surah-title" style="font-size: 16px;">سورة: ${surahsNames[selectedSpecialSurah]}</span>
        </div>
        <div class="continuous-quran-text" style="text-align: right; font-size: 21px; line-height: 3.5;">
            <span class="ayah-blue">${promptText}</span>
            ${promptNumDisplay !== "" ? `<span class="circle-num">${promptNumDisplay}</span>` : ""}
            
            <span id="special-full-target-blank" class="blank-space" style="visibility: hidden; color: #16a34a !important;">${fullTargetHTML}</span>
        </div>
    `;

    if (exerciseContainer) {
        exerciseContainer.innerHTML = customLayoutHTML;
    }
}

// دالة التفاعل عند الضغط على أي آية داخل المقطع وإظهار الأزرار الأربعة
function handleSpecialAyahClick(ayahIndex) {
    resetRecordingStates();

    // إزالة التحديد وإغلاق النوافذ السابقة لكل الآيات
    for (let a = specialStartAyah - 1; a < specialEndAyah; a++) {
        const el = document.getElementById(`special-ayah-item-${a}`);
        const menuEl = document.getElementById(`ayah-popup-menu-${a}`);
        if (el) el.style.backgroundColor = "transparent";
        if (menuEl) menuEl.remove();
    }

    const clickedAyahSpan = document.getElementById(`special-ayah-item-${ayahIndex}`);
    if (clickedAyahSpan) {
        clickedAyahSpan.style.backgroundColor = "rgba(254, 240, 138, 0.6)";

        const popupDiv = document.createElement('div');
        popupDiv.id = `ayah-popup-menu-${ayahIndex}`;
        popupDiv.style.cssText = `
            display: flex;
            gap: 6px;
            margin-top: 8px;
            margin-bottom: 8px;
            padding: 8px;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
            animation: fadeIn 0.2s ease-in-out;
        `;

        popupDiv.innerHTML = `
            <button class="btn-rate btn-forgot" style="font-size: 12px; padding: 4px 8px;" onclick="console.log('زر: تعثر (بحاجة لمراجعة) للآية ${ayahIndex + 1}')">⚠️ تعثر (بحاجة لمراجعة)</button>
            <button class="btn-rate btn-hard" style="font-size: 12px; padding: 4px 8px;" onclick="console.log('زر: سماع صوتي للآية ${ayahIndex + 1}')">🎙️ سماع صوتي</button>
            <button class="btn-rate btn-good" style="font-size: 12px; padding: 4px 8px;" onclick="console.log('زر: صوت الشيخ للآية ${ayahIndex + 1}')">🔊 صوت الشيخ</button>
            <button class="btn-rate btn-easy" style="font-size: 12px; padding: 4px 8px;" onclick="resumeNormalReading(${ayahIndex})">🔄 مواصلة</button>
        `;

        clickedAyahSpan.after(popupDiv);
    }
}

// دالة زر المواصلة لإعادة الآية لوضعها الطبيعي وإخفاء النافذة المنبثقة
function resumeNormalReading(ayahIndex) {
    const clickedAyahSpan = document.getElementById(`special-ayah-item-${ayahIndex}`);
    const menuEl = document.getElementById(`ayah-popup-menu-${ayahIndex}`);
    
    if (clickedAyahSpan) {
        clickedAyahSpan.style.backgroundColor = "transparent";
    }
    if (menuEl) {
        menuEl.remove();
    }
}

function revealSpecialFullAnswer() {
    if (isRecording && mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        isRecording = false;
        isRecordingPaused = false;
    }

    const blankEl = document.getElementById('special-full-target-blank');
    if (blankEl) blankEl.style.visibility = 'visible';

    const showBtn = document.getElementById('show-btn');
    const ratingArea = document.getElementById('rating-area');
    const sheikhBtn = document.getElementById('sheikh-audio-btn');

    if (showBtn) showBtn.classList.add('hidden');
    if (ratingArea) ratingArea.classList.remove('hidden');
    if (sheikhBtn) sheikhBtn.classList.remove('hidden');

    const recordBtn = document.getElementById('record-action-btn');
    if (recordBtn) {
        recordBtn.innerText = "▶️ عرض التسجيل";
        recordBtn.className = "btn-recording";
    }
}

function handleSpecialRecordingToggle() {
    const recordBtn = document.getElementById('record-action-btn');
    const showBtn = document.getElementById('show-btn');
    const isAnswerRevealed = showBtn && showBtn.classList.contains('hidden');

    if (isAnswerRevealed) {
        togglePlaybackRecordedAudio(recordBtn);
    } else {
        toggleRecordUserVoice(recordBtn);
    }
}

function nextSpecialQuestion(ratingType) {
    alert("أحسنت! لقد أتممت جلسة المراجعة الخاصة بهذا المقطع بنجاح.");
    showSpecialSessionScreen(); 
}


// ==========================================
// أدوات صوتية مشتركة ومساعدة
// ==========================================
function toggleRecordUserVoice(btnElement) {
    if (!isRecording && !isRecordingPaused) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                recordedAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                recordedAudioUrl = URL.createObjectURL(recordedAudioBlob);
                playbackAudioElement = new Audio(recordedAudioUrl);
                
                playbackAudioElement.onended = () => {
                    isPlayingRecording = false;
                    btnElement.innerText = "▶️ عرض التسجيل";
                    btnElement.classList.remove('playing-active');
                };
            };

            mediaRecorder.start();
            isRecording = true;
            isRecordingPaused = false;
            btnElement.innerText = "⏸️ إيقاف";
            btnElement.classList.add('recording-active');
        }).catch((err) => {
            alert("تعذر الوصول إلى الميكروفون.");
        });
    } else if (isRecording && !isRecordingPaused) {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.pause();
        }
        isRecording = false;
        isRecordingPaused = true;
        btnElement.innerText = "⏺️ مواصلة";
        btnElement.classList.remove('recording-active');
    } else {
        if (mediaRecorder && mediaRecorder.state === "paused") {
            mediaRecorder.resume();
        }
        isRecording = true;
        isRecordingPaused = false;
        btnElement.innerText = "⏸️ إيقاف";
        btnElement.classList.add('recording-active');
    }
}

function togglePlaybackRecordedAudio(btnElement) {
    if (!recordedAudioBlob || !playbackAudioElement) {
        alert("لا يوجد تسجيل صوتي متاح للعرض بعد.");
        return;
    }

    if (!isPlayingRecording) {
        playbackAudioElement.play();
        isPlayingRecording = true;
        btnElement.innerText = "⏸️ إيقاف العرض";
        btnElement.classList.add('playing-active');
    } else {
        playbackAudioElement.pause();
        isPlayingRecording = false;
        btnElement.innerText = "▶️ مواصلة العرض";
        btnElement.classList.remove('playing-active');
    }
}

function resetRecordingStates() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        try { mediaRecorder.stop(); } catch (e) {}
    }
    if (playbackAudioElement) {
        playbackAudioElement.pause();
        playbackAudioElement = null;
    }
    isRecording = false;
    isRecordingPaused = false;
    isPlayingRecording = false;
    recordedAudioBlob = null;
    recordedAudioUrl = null;
    audioChunks = [];
}

function handleSheikhAudioPlaceholder() {
    console.log("زر صوت الشيخ - جاهز للنقاش المستقبلي");
}

let currentContextOffset = 0; 
function expandContext() {
    if (!currentReviewItem) return;
    currentContextOffset++;
    const targetAyahIndex = currentReviewItem.ayah - currentContextOffset;
    if (targetAyahIndex < 0) {
        alert("هذه هي الآية الأولى في السورة.");
        currentContextOffset--; 
        return;
    }
    const prevAyahText = getFromMemory("ayah_texts.json", currentReviewItem.riwaya, currentReviewItem.surah, targetAyahIndex);
    const prevAyahNum = targetAyahIndex + 1;
    const prevAyahsContainer = document.getElementById('prev-ayahs-container');
    if (prevAyahsContainer && prevAyahText) {
        const ayahSpan = document.createElement('span');
        ayahSpan.className = "ayah-gray";
        ayahSpan.innerHTML = `${prevAyahText} <span class="circle-num">${prevAyahNum}</span> `;
        prevAyahsContainer.prepend(ayahSpan);
    }
}

function playCurrentTargetAyahAudio() { console.log("تشغيل الصوت"); }