// ==========================================
// ملف واجهات المستخدم (doms.js) - المحدث بالفلسفة الجديدة
// ==========================================

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('install-app-btn');
    if (installBtn) installBtn.style.display = 'block';
});

async function installAppToDevice() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            const installBtn = document.getElementById('install-app-btn');
            if (installBtn) installBtn.style.display = 'none';
        }
        deferredPrompt = null;
    }
}

function showWelcomeScreen() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const welcomeScreenHTML = `
        <div id="settings-btn-icon" class="settings-icon" onclick="showSettings()" title="الإعدادات">☰</div>
        <div id="help-btn-icon" class="help-icon" onclick="showHelpScreen()" title="لماذا هذا التطبيق؟">؟</div>
        
        <div id="welcome-screen" class="home-content">
            <div class="app-icon">📖</div>
            <div class="app-title">ابن باديس</div>
            <div class="app-slogan">تثبيت حفظ القرآن الكريم</div>
            <button class="btn-main" onclick="handleStartAppProcess()">ابدأ الان</button>
            <button id="install-app-btn" class="btn-install" style="display: none; margin-top: 12px;" onclick="installAppToDevice()">📥 تنزيل وتثبيت التطبيق</button>
        </div>
    `;
    renderInContainer(welcomeScreenHTML);
    if (isStandalone) {
        const installBtn = document.getElementById('install-app-btn');
        if (installBtn) installBtn.style.display = 'none';
    } else if (deferredPrompt) {
        const installBtn = document.getElementById('install-app-btn');
        if (installBtn) installBtn.style.display = 'block';
    }
}

// ==========================================
// تعديل أزرار القائمة الرئيسية (doms_4.js)
// ==========================================

function showMainButtons() {
    const MainButtonshtml = `
        <div id="settings-btn-icon" class="settings-icon" onclick="showSettings()" title="الإعدادات">☰</div>
        <div id="help-btn-icon" class="help-icon" onclick="showHelpScreen()" title="لماذا هذا التطبيق؟">؟</div>
        
        <div class="home-content">
            <div class="app-icon" style="font-size: 40px; margin-bottom: 5px;">📖</div>
            <div class="app-title" style="font-size: 24px; margin-bottom: 2px;">ابن باديس</div>
            <div class="app-slogan" style="font-size: 13px; margin-bottom: 25px;">تثبيت حفظ القرآن الكريم</div>
            
            <button class="btn-main" onclick="showSpecialSessionScreen()">المراجعة اليومية</button>
            
            <div style="margin-top: 10px; margin-bottom: 15px;">
                <button class="btn-secondary" onclick="showReviewScreen()" style="width: 100%;">عقال الآيات</button>
                <div style="font-size: 11px; color: #64748b; margin-top: 3px; font-weight: normal;">التكرار المتباعد لضبط الصعوبات</div>
            </div>

            <button class="btn-secondary" onclick="showWelcomeScreen()" style="margin-top: 10px; background-color: #64748b; color: white;">العودة للرئيسية</button>
        </div>
    `;
    renderInContainer(MainButtonshtml);
}

function showHelpScreen() {
    const helpScreenHTML = `
        <div class="header-box">
            <button class="btn-home" onclick="showWelcomeScreen()" title="العودة للصفحة الرئيسية" style="background-color: #64748b; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold;">🏠 الرئيسية</button>
            <div class="surah-title">لماذا هذا التطبيق؟</div>
        </div>

        <div class="help-content-box">
            <div class="help-section">
                <h3>1. ما هو هذا التطبيق؟</h3>
                <p>هذا التطبيق ليس منصة لتحفيظ القرآن الكريم من الصفر، بل هو أداة للضبط والتمكين. دوره الحقيقي يبدأ <strong>بعد الحفظ</strong>؛ إنه رفيقك الخفي لتثبيت المتشابهات، وضبط المحفوظ، وقهر النسيان في الآيات التي تتعثر فيها[cite: 12].</p>
            </div>
            <div class="help-section">
                <h3>2. السند العلمي الحديث: هندسة الذاكرة</h3>
                <p>يعتمد هذا التطبيق على <strong>"نظرية التكرار المتباعد"</strong>، وهي من أقوى النظريات العلمية المعترف بها في علم النفس المعرفي لنقل المعلومات من الذاكرة قصيرة المدى إلى الذاكرة طويلة المدى[cite: 12].</p>
            </div>
            <div class="help-section">
                <h3>3. المرجعية التراثية: فراسة أهل الزوايا</h3>
                <p>المذاكرة النشطة هي طريقة أصيلة في تراثنا[cite: 12]. فشيوخ الزوايا والكتاتيب لم يكونوا بحاجة إلى معادلات رقمية، بل هداهم حسهم القرآني إلى أن استنهاض الذاكرة أنفع بكثير من القراءة السلبية المكررة[cite: 12].</p>
            </div>
        </div>
        <button class="btn-main" style="margin-top: 20px;" onclick="showWelcomeScreen()">العودة للرئيسية</button>
    `;
    renderInContainer(helpScreenHTML);
}

function showSettings() {
    const isWarshChecked = typeof userRiwaya === 'undefined' || userRiwaya === 0 ? 'checked' : '';
    const isHafsChecked = userRiwaya === 1 ? 'checked' : '';
    const currentDailyCount = typeof userCountLearningPlannedToday !== 'undefined' ? userCountLearningPlannedToday : 10;

    const settingsHTML = `
        <div class="settings-header">
            <h2 class="settings-title">إعدادات المراجعة</h2>
        </div>

        <div class="setting-row-box">
            <span class="setting-row-label">رواية القرآن الكريم:</span>
            <div class="radio-options">
                <label class="radio-label">
                    <input type="radio" name="riwaya" value="0" ${isWarshChecked} onchange="changeRiwayaSetting(0)"> ورش
                </label>
                <label class="radio-label">
                    <input type="radio" name="riwaya" value="1" ${isHafsChecked} onchange="changeRiwayaSetting(1)"> حفص
                </label>
            </div>
        </div>

        <div class="setting-row-box">
            <span class="setting-row-label">عدد آيات المراجعة اليومية:</span>
            <input type="number" id="daily-count-input" value="${currentDailyCount}" min="1" max="100" style="padding: 6px; border-radius: 6px; border: 1px solid #cbd5e1; width: 70px; text-align: center;">
        </div>

        <div style="text-align: right; margin-bottom: 8px; font-weight: bold; color: #334155; font-size: 15px;">
          تفعيل السور للمراجعة:
        </div>
        <div class="surah-list-container" id="surahs-checkboxes-container">
            <div style="padding: 10px; color: #64748b;">جاري تحميل القائمة...</div>
        </div>

        <button class="btn-main" style="margin-top: 20px;" onclick="saveSettingsAndReturn()">العودة للقائمة</button>
    `;
   
    renderInContainer(settingsHTML);
    loadQuranSurahsToUI();
}

function changeRiwayaSetting(riwayaIndex) {
    userRiwaya = riwayaIndex; 
    if (typeof sendDataUser === 'function') {
        sendDataUser("riwaya", riwayaIndex);
    }
    loadQuranSurahsToUI();   
}

function renderInContainer(htmlContent) {
    const container = document.getElementById('main-container');
    if (!container) return;
    container.innerHTML = `<div class="welcome-container">${htmlContent}</div>`;
}

// تحميل قائمة السور مع عرض عدد الآيات المفعلة الحقيقي بدقة وسرعة من قاعدة البيانات
async function loadQuranSurahsToUI() {
    const container = document.getElementById('surahs-checkboxes-container');
    if (!container) return;

    if (typeof surahsNames === 'undefined' || !surahsNames.length) {
        container.innerHTML = '<div style="color: #dc2626; text-align: center;">قائمة السور غير متوفرة.</div>';
        return;
    }

    let htmlContent = '';
    const currentRiwayaIndex = typeof userRiwaya !== 'undefined' ? userRiwaya : 0;

    for (let index = 0; index < surahsNames.length; index++) {
        const surahName = surahsNames[index];
        const surahNumber = index + 1;
        const totalAyats = (typeof ayatCount !== 'undefined' && ayatCount[currentRiwayaIndex]) ? ayatCount[currentRiwayaIndex][index] : 7;
        
        let activeCount = 0;
        let isSurahActive = false;

        try {
            const surahStatuses = memoryQuranStatuses[currentRiwayaIndex]?.[index] || [];
            for (let a = 0; a < totalAyats; a++) {
                if (surahStatuses[a] === 1) {
                    activeCount++;
                } else {
                    break; 
                }
            }
            isSurahActive = (activeCount > 0);
        } catch (e) {
            activeCount = 0;
            isSurahActive = false;
        }

        const checkedAttr = isSurahActive ? 'checked' : '';
        const limitBoxDisplay = isSurahActive ? 'flex' : 'none';
        const displayLimitVal = isSurahActive ? activeCount : totalAyats;

        htmlContent += `
            <div class="surah-row-item" id="surah-row-${index}">
                <div class="surah-row-right">
                    <label class="switch" style="flex-shrink: 0;">
                        <input type="checkbox" id="surah-toggle-${index}" ${checkedAttr} onchange="handleSurahToggleChange(${index}, ${totalAyats})">
                        <span class="slider"></span>
                    </label>
                    <span style="font-weight: bold; color: #1b4d3e; font-size: 14px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${surahNumber}. ${surahName}</span>
                </div>

                <div class="surah-row-left" id="surah-limit-box-${index}" style="display: ${limitBoxDisplay};">
                    <span style="font-size: 12px; color: #64748b; white-space: nowrap;">إلى:</span>
                    <input type="text" id="surah-max-ayah-${index}" value="${displayLimitVal}" 
                        oninput="handleAyahLimitInput(${index}, ${totalAyats})" 
                        style="width: 48px; text-align: center; padding: 3px; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: bold; color: #2d6a4f; font-size: 13px;"
                    >
                </div>
            </div>
        `;
    }

    container.innerHTML = htmlContent;
}

async function handleSurahToggleChange(surahIndex, totalAyats) {
    const toggleInput = document.getElementById(`surah-toggle-${surahIndex}`);
    const limitBox = document.getElementById(`surah-limit-box-${surahIndex}`);
    const inputField = document.getElementById(`surah-max-ayah-${surahIndex}`);
    const currentRiwaya = typeof userRiwaya !== 'undefined' ? userRiwaya : 0;

    if (!toggleInput || !limitBox || !inputField) return;

    if (!memoryQuranStatuses[currentRiwaya]) {
        memoryQuranStatuses[currentRiwaya] = [];
    }
    if (!memoryQuranStatuses[currentRiwaya][surahIndex]) {
        memoryQuranStatuses[currentRiwaya][surahIndex] = [];
    }

    if (toggleInput.checked) {
        limitBox.style.display = 'flex';
        let targetLimit = parseInt(inputField.value, 10) || totalAyats;
        if (targetLimit > totalAyats) targetLimit = totalAyats;

        for (let a = 0; a < totalAyats; a++) {
            const statusValue = (a < targetLimit) ? 1 : 0;
            memoryQuranStatuses[currentRiwaya][surahIndex][a] = statusValue;
            if (typeof sendData === 'function') {
                await sendData("ayah_statuses.json", currentRiwaya, surahIndex, a, statusValue);
            }
        }
    } else {
        limitBox.style.display = 'none';
        for (let a = 0; a < totalAyats; a++) {
            memoryQuranStatuses[currentRiwaya][surahIndex][a] = 0;
            if (typeof sendData === 'function') {
                await sendData("ayah_statuses.json", currentRiwaya, surahIndex, a, 0);
            }
        }
    }
}

async function handleAyahLimitInput(surahIndex, maxAyats) {
    const inputField = document.getElementById(`surah-max-ayah-${surahIndex}`);
    const toggleInput = document.getElementById(`surah-toggle-${surahIndex}`);
    const currentRiwaya = typeof userRiwaya !== 'undefined' ? userRiwaya : 0;

    if (!inputField || !toggleInput) return;

    let val = inputField.value.trim();
    if (val === "") return;

    let num = parseInt(val, 10);
    if (isNaN(num) || num < 1) {
        num = 1;
    } else if (num > maxAyats) {
        num = maxAyats;
        inputField.value = maxAyats;
    }

    if (!memoryQuranStatuses[currentRiwaya]) {
        memoryQuranStatuses[currentRiwaya] = [];
    }
    if (!memoryQuranStatuses[currentRiwaya][surahIndex]) {
        memoryQuranStatuses[currentRiwaya][surahIndex] = [];
    }

    if (toggleInput.checked && typeof sendData === 'function') {
        for (let a = 0; a < maxAyats; a++) {
            const statusValue = (a < num) ? 1 : 0;
            memoryQuranStatuses[currentRiwaya][surahIndex][a] = statusValue;
            await sendData("ayah_statuses.json", currentRiwaya, surahIndex, a, statusValue);
        }
    }
}

function startSpecialSurahSession() {}
function playCurrentTargetAyahAudio() {}
function revealAnswer() {}
function nextQuestion(type) { showReviewScreen(); }