// متغير عام لحفظ حدث التثبيت الرسمي من المتصفح
let deferredPrompt = null;

// الاستماع لحدث جاهزية التثبيت من المتصفح
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // إظهار زر التنزيل فوراً بمجرد أن يصبح التطبيق جاهزاً
    const installBtn = document.getElementById('install-app-btn');
    if (installBtn) {
        installBtn.style.display = 'block';
    }
});

// 1. شاشة الترحيب الأولى (مفعلة وتعمل بشكل كامل)
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
            <!-- زر التنزيل الموحد بمعرّف صحيح -->
            <button id="install-app-btn" class="btn-install" style="display: none; margin-top: 12px;" onclick="installAppToDevice()">📥 تنزيل وتثبيت التطبيق</button>
        </div>
    `;
    renderInContainer(welcomeScreenHTML);

    // إذا كان التطبيق مثبتاً مسبقاً، نخفي الزر نهائياً
    if (isStandalone) {
        const installBtn = document.getElementById('install-app-btn');
        if (installBtn) installBtn.style.display = 'none';
    } else if (deferredPrompt) {
        // إذا كان الحدث مخزناً مسبقاً، أظهر الزر فوراً
        const installBtn = document.getElementById('install-app-btn');
        if (installBtn) installBtn.style.display = 'block';
    }
}

// دالة تنفيذ التنزيل الفوري عند النقر
async function installAppToDevice() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('المستخدم وافق على تثبيت التطبيق');
            const installBtn = document.getElementById('install-app-btn');
            if (installBtn) installBtn.style.display = 'none';
        }
        deferredPrompt = null;
    }
}

// 2. شاشة الخيارات الرئيسية (الخيارات الثلاثة)
function showMainButtons() {
    const MainButtonshtml = `
        <div id="settings-btn-icon" class="settings-icon" onclick="showSettings()" title="الإعدادات">☰</div>
        <div id="help-btn-icon" class="help-icon" onclick="showHelpScreen()" title="لماذا هذا التطبيق؟">؟</div>
        
        <div class="home-content">
            <div class="app-icon" style="font-size: 40px; margin-bottom: 5px;">📖</div>
            <div class="app-title" style="font-size: 24px; margin-bottom: 2px;">ابن باديس</div>
            <div class="app-slogan" style="font-size: 13px; margin-bottom: 25px;">تثبيت حفظ القرآن الكريم</div>
            <button class="btn-main" onclick="showReviewScreen()">المراجعة اليومية</button>
            <button class="btn-secondary" onclick="startNewItemsSession()" style="margin-top: 10px;">الآيات الجديدة</button>
            <button class="btn-secondary" onclick="showSpecialSessionScreen()" style="margin-top: 10px;">مراجعة خاصة</button>
            <button class="btn-secondary" onclick="showWelcomeScreen()" style="margin-top: 15px; background-color: #64748b; color: white;">العودة للرئيسية</button>
        </div>
    `;
    renderInContainer(MainButtonshtml);
}

// 3. صفحة البطاقات الجديدة (الآيات الجديدة) - الصفحة المضافة حديثاً
function startNewItemsSession() {
    const newItemsHTML = `
        <div class="header-box">
            <button class="btn-home" onclick="showWelcomeScreen()" title="العودة للصفحة الرئيسية" style="background-color: #64748b; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold;">🏠 الرئيسية</button>
            <div class="surah-title">جلسة الآيات الجديدة</div>
        </div>

        <div class="exercise-box" style="text-align: center;">
            <p style="color: #52796f; font-size: 18px; margin-bottom: 15px; font-weight: bold;">إضافة وحفظ آيات جديدة للبرنامج</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.8;">
                هذه الصفحة مخصصة لاستعراض وإدخال الآيات الجديدة التي ترغب في إدراجها ضمن دورات التثبيت والتكرار المتباعد.
            </p>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button class="btn-main" onclick="alert('سيتم تفعيل حفظ الآيات الجديدة لاحقاً')">حفظ وإضافة الآية</button>
            <button class="btn-secondary" onclick="showMainButtons()" style="background-color: #64748b; color: white;">رجوع للقائمة</button>
        </div>
    `;
    renderInContainer(newItemsHTML);
}

// 4. شاشة الجلسة الخاصة (استعراض سورة)
function showSpecialSessionScreen() {
    const specialSessionScreenHTML = `
        <div class="settings-header">
            <h2 class="settings-title">الجلسة الخاصة - استعراض سورة</h2>
        </div>
        <div style="text-align: right; margin-bottom: 8px; font-weight: bold; color: #334155; font-size: 15px;">
            اختر السورة المراد استعراضها:
        </div>
        <div class="surah-list-container" id="special-surahs-container">
            <div style="padding: 10px; color: #64748b;">(قائمة السور ستظهر هنا ديناميكياً)</div>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button class="btn-main" onclick="startSpecialSurahSession()">ابدأ الاستعراض</button>
            <button class="btn-secondary" onclick="showMainButtons()" style="background-color: #64748b; color: white;">العودة للقائمة</button>
        </div>
    `;
    renderInContainer(specialSessionScreenHTML);
}

// 5. شاشة "لماذا هذا التطبيق؟" (المساعدة)
function showHelpScreen() {
    const helpScreenHTML = `
        <div class="header-box">
            <button class="btn-home" onclick="showWelcomeScreen()" title="العودة للصفحة الرئيسية" style="background-color: #64748b; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold;">🏠 الرئيسية</button>
            <div class="surah-title">لماذا هذا التطبيق؟</div>
        </div>

        <div class="help-content-box">
            <div class="help-section">
                <h3>1. ما هو هذا التطبيق؟</h3>
                <p>هذا التطبيق ليس منصة لتحفيظ القرآن الكريم من الصفر، بل هو أداة للضبط والتمكين. دوره الحقيقي يبدأ <strong>بعد الحفظ</strong>؛ إنه رفيقك الخفي لتثبيت المتشابهات، وضبط المحفوظ، وقهر النسيان في الآيات التي تتعثر فيها.</p>
            </div>
            <div class="help-section">
                <h3>2. السند العلمي الحديث: هندسة الذاكرة</h3>
                <p>يعتمد هذا التطبيق على <strong>"نظرية التكرار المتباعد"</strong>، وهي من أقوى النظريات العلمية المعترف بها في علم النفس المعرفي لنقل المعلومات من الذاكرة قصيرة المدى إلى الذاكرة طويلة المدى.</p>
            </div>
            <div class="help-section">
                <h3>3. المرجعية التراثية: فراسة أهل الزوايا</h3>
                <p>المذاكرة النشطة هي طريقة أصيلة في تراثنا. فشيوخ الزوايا والكتاتيب لم يكونوا بحاجة إلى معادلات رقمية، بل هداهم حسهم القرآني إلى أن استنهاض الذاكرة أنفع بكثير من القراءة السلبية المكررة.</p>
            </div>
        </div>
        <button class="btn-main" style="margin-top: 20px;" onclick="showWelcomeScreen()">العودة للرئيسية</button>
    `;
    renderInContainer(helpScreenHTML);
}

// 6. شاشة الإعدادات
// 1. شاشة الإعدادات المحدثة لربط الرواية وحفظ الخيارات
function showSettings() {
    // تحديد أي رواية مفعلة حالياً بناءً على المتغير العام userRiwaya (0 لورش، 1 لحفص)
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
        <!-- الحاوية التي ستستقبل السور ديناميكياً -->
        <div class="surah-list-container" id="surahs-checkboxes-container">
            <!-- سيتم تعبئتها تلقائياً -->
        </div>

        <button class="btn-main" style="margin-top: 20px;" onclick="saveSettingsAndReturn()">حفظ والعودة للقائمة</button>
    `;
   
    // عرض الواجهة أولاً
    renderInContainer(settingsHTML);
    
    // ثم جلب وعرض السور بناءً على الرواية الحالية
    loadQuranSurahsToUI();
}

// 2. دالة التبديل الفوري للرواية وإعادة تحديث أعداد الآيات في القائمة
function changeRiwayaSetting(riwayaIndex) {
    userRiwaya = riwayaIndex; // تحديث المتغير العام
    loadQuranSurahsToUI();   // إعادة تحميل السور لتحديث أقصى عدد آيات بناءً على الرواية الجديدة
}
/*
// 3. دالة حفظ الإعدادات والعودة
function saveSettingsAndReturn() {
    // حفظ عدد الآيات اليومية
    const dailyCountEl = document.getElementById('daily-count-input');
    if (dailyCountEl) {
        userCountLearningPlannedToday = parseInt(dailyCountEl.value, 10) || 10;
    }

    // هنا يمكنك حفظ حالة السور المفعلة وسقوف الآيات في متغيرات أو localStorage لاحقاً
    console.log("تم حفظ الإعدادات بنجاح. الرواية الحالية:", userRiwaya);
    
    showMainButtons();
}
    */
// 7. شاشة المراجعة والتمرين
function showReviewScreen() {
    const reviewScreenHTML = `
        <div class="header-box">
            <button class="btn-home" onclick="showMainButtons()" title="العودة للقائمة الرئيسية" style="background-color: #64748b; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold;">🏠 القائمة</button>

            <div style="display: flex; align-items: center;">
                <div id="counters-wrapper" class="inline-counters">
                    <span id="count-blue" class="counter-blue">0</span>
                    <span id="count-red" class="counter-red">0</span>
                    <span id="count-green" class="counter-green">0</span>
                </div>
                <div id="surah-name" class="surah-title">سورة: معاينة الواجهة</div>
            </div>
        </div>

        <div class="exercise-box" id="exercise-container">
            <button class="expand-arc-btn" onclick="expandContext()" title="إظهار الآية السابقة للمساعدة" style="position:absolute; top:5px; left:5px; border-radius:50%; width:25px; height:25px; border:1px solid #2d6a4f; background:#e6f4f1; cursor:pointer;">&#8593;</button>

            <button id="play-ayah-audio-btn" onclick="playCurrentTargetAyahAudio()" class="audio-btn" style="position:absolute; bottom:5px; left:5px; background: #e6f4f1; color: black; border: none; padding: 4px 10px; border-radius: 15px; font-size: 12px; cursor: pointer;">
                🔊
            </button>
            <audio id="ayah-audio-element" style="display: none;"></audio>

            <span id="prev-ayahs-container" class="ayah-prev"></span>
            <span id="prompt-ayah" class="ayah-blue">مثال على الآية المعروضة للمراجعة...</span>
            <span class="circle-num" id="prompt-num">1</span>

            <span id="target-blank-1" class="blank-space">كلمة</span>
            <span class="circle-num" id="target-num-1">2</span>

            <span id="target-blank-2" class="blank-space-gray">كلمة</span>
            <span class="circle-num" id="target-num-2">3</span>
        </div>
        
        <div id="action-area">
            <button id="show-btn" class="btn-main" onclick="revealAnswer()">عرض الإجابة</button>
        </div>

        <div id="rating-area" class="rating-buttons">
            <button class="btn-rate btn-forgot" onclick="nextQuestion('forgot')">نسيت</button>
            <button class="btn-rate btn-hard" onclick="nextQuestion('hard')">صعب</button>
            <button class="btn-rate btn-good" onclick="nextQuestion('good')">جيد</button>
            <button class="btn-rate btn-easy" onclick="nextQuestion('easy')">سهل</button>
        </div>
    `;
    renderInContainer(reviewScreenHTML);
}

// دالة مساعدة للعرض
function renderInContainer(htmlContent) {
    const container = document.getElementById('main-container');
    if (!container) return;
    container.innerHTML = `<div class="welcome-container">${htmlContent}</div>`;
}

// دوال وهمية مؤقتة
function startSpecialSurahSession() {}
function expandContext() {}
function playCurrentTargetAyahAudio() {}
function revealAnswer() {}
function nextQuestion(type) { showReviewScreen(); }




// الدالة المسؤولة عن عرض قائمة السور في شاشة الإعدادات باستخدام المصفوفة الثابتة surahsNames
function loadQuranSurahsToUI() {
    const container = document.getElementById('surahs-checkboxes-container');
    if (!container) return;

    if (typeof surahsNames === 'undefined' || !surahsNames.length) {
        container.innerHTML = '<div style="color: #dc2626; text-align: center;">قائمة السور غير متوفرة.</div>';
        return;
    }

    let htmlContent = '';

    surahsNames.forEach((surahName, index) => {
        const surahNumber = index + 1;
        const currentRiwayaIndex = typeof userRiwaya !== 'undefined' ? userRiwaya : 0;
        const totalAyats = (typeof ayatCount !== 'undefined' && ayatCount[currentRiwayaIndex]) ? ayatCount[currentRiwayaIndex][index] : 7;
        
        htmlContent += `
            <div class="surah-row-item" id="surah-row-${index}">
                <!-- الجهة اليمنى: زر التبديل واسم السورة -->
                <div class="surah-row-right">
                    <label class="switch" style="flex-shrink: 0;">
                        <input type="checkbox" id="surah-toggle-${index}" onchange="toggleSurahLimitInput(${index}, ${totalAyats})">
                        <span class="slider"></span>
                    </label>
                    <span style="font-weight: bold; color: #1b4d3e; font-size: 14px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${surahNumber}. ${surahName}</span>
                </div>

                <!-- الجهة اليسرى: خانة إدخال سقف الآيات (تبقى في نفس السطر) -->
                <div class="surah-row-left" id="surah-limit-box-${index}" style="display: none;">
                    <span style="font-size: 12px; color: #64748b; white-space: nowrap;">إلى:</span>
                    <input type="text" id="surah-max-ayah-${index}" value="${totalAyats}" 
                        oninput="validateAyahInput(this, ${totalAyats})" 
                        style="width: 48px; text-align: center; padding: 3px; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: bold; color: #2d6a4f; font-size: 13px;"
                    >
                </div>
            </div>
        `;
    });





    container.innerHTML = htmlContent;
}
// إظهار أو إخفاء خانة الآيات عند تفعيل/إلغاء تفعيل السورة
function toggleSurahLimitInput(index, totalAyats) {
    const isChecked = document.getElementById(`surah-toggle-${index}`).checked;
    const limitBox = document.getElementById(`surah-limit-box-${index}`);
    const inputField = document.getElementById(`surah-max-ayah-${index}`);

    if (isChecked) {
        limitBox.style.display = 'flex';
        inputField.value = totalAyats; // القيمة الابتدائية الكل
    } else {
        limitBox.style.display = 'none';
    }
}

// التحقق من صحة الرقم المدخل لئلا يتجاوز عدد آيات السورة أو يقل عن 1
function validateAyahInput(inputElement, maxAyats) {
    let val = inputElement.value.trim();

    // السماح للمستخدم بكتابة الحذف بسلاسة
    if (val === "") return;

    let num = parseInt(val, 10);

    if (isNaN(num) || num < 1) {
        inputElement.value = 1;
    } else if (num > maxAyats) {
        inputElement.value = maxAyats;
    } else if (num === maxAyats) {
        // إذا ساوى العدد الإجمالي يمكن اعتباره "الكل" بصرياً أو إبقاؤه كقيمة عظمى
        inputElement.value = maxAyats;
    }
}

// دالة حفظ الإعدادات المتكاملة وفق هيكلة IndexedDB المعتمدة
async function saveSettingsAndReturn() {
    try {
        const db = await openDatabase();

        // 1. قراءة القيم المدخلة من واجهة الإعدادات
        const dailyCountEl = document.getElementById('daily-count-input');
        const newDailyTarget = dailyCountEl ? parseInt(dailyCountEl.value, 10) || 10 : 10;
        const currentRiwaya = typeof userRiwaya !== 'undefined' ? userRiwaya : 0;

        // --- أ. التعامل مع ملف إعدادات المستخدم العامة (إنشاؤه إذا لم يكن موجوداً) ---
        let userSettings = await getFileFromDB("userSettings.json"); // أو أي مفتاح تعتمده للإعدادات العامة
        if (!userSettings) {
            userSettings = {
                riwaya: currentRiwaya,
                dailyLearningTarget: newDailyTarget,
                createdAt: new Date().toISOString()
            };
        } else {
            userSettings.riwaya = currentRiwaya;
            userSettings.dailyLearningTarget = newDailyTarget;
            userSettings.updatedAt = new Date().toISOString();
        }
        // حفظ الإعدادات العامة في IndexedDB
        await storeDataInDB(db, "userSettings.json", userSettings);
        userCountLearningPlannedToday = newDailyTarget; // تحديث المتغير العام


        // --- ب. التعامل مع ملف userProgress.json (تفعيل الآيات آية باية وتغيير حالتها) ---
        let progressData = await getFileFromDB("userProgress.json");
        
        // إذا لم يكن موجوداً، نقوم بإنشائه كهيكل أساسي يتناسب مع الرواية والسور
        if (!progressData || !Array.isArray(progressData)) {
            progressData = []; 
            // ملاحظة: يتم تهيئته هيكلياً حسب الرواية والسور بحيث تكون كل الآيات افتراضياً 'disable'
        }

        let activeSurahsCount = 0;

        // 2. المرور على كافة السور (114 سورة) لفحص اختيارات المستخدم
        for (let surahIndex = 0; surahIndex < surahsNames.length; surahIndex++) {
            const toggleEl = document.getElementById(`surah-toggle-${surahIndex}`);
            const maxAyahEl = document.getElementById(`surah-max-ayah-${surahIndex}`);

            // التأكد من أن الهيكل الخاص بهذه السورة موجود في progressData
            if (!progressData[currentRiwaya]) progressData[currentRiwaya] = [];
            if (!progressData[currentRiwaya][surahIndex]) progressData[currentRiwaya][surahIndex] = [];

            if (toggleEl && toggleEl.checked) {
                // إذا كانت السورة مفعلة، نقرأ السقف المدخل (إلى الآية)
                const maxAyahLimit = maxAyahEl ? parseInt(maxAyahEl.value, 10) || 1 : 1;
                activeSurahsCount++;

                // تفعيل الآيات آية بآية حتى السقف المحدد، وتعطيل ما فوقه
                // بنية الحالة داخل الـ array: [status, subStatus, difficulty, lastReviewed] أو ما يعتمد عليه نظامك
                for (let ayahIndex = 0; ayahIndex < totalAyatsForSurah; ayahIndex++) {
                    if (ayahIndex < maxAyahLimit) {
                        // تفعيل الآية (تحويلها إلى enable أو تحديث حالتها)
                        progressData[currentRiwaya][surahIndex][ayahIndex] = {
                            status: 'enable', // تم تفعيلها للمراجعة
                            // بقية خصائص التقدم إن وجدت
                        };
                    } else {
                        // ما عدا ذلك تبقى أو تعود إلى disable
                        progressData[currentRiwaya][surahIndex][ayahIndex] = {
                            status: 'disable'
                        };
                    }
                }
            } else {
                // إذا لم تفعّل السورة نهائياً، تعطيل كافة آياتها
                const totalAyatsForSurah = (typeof ayatCount !== 'undefined') ? ayatCount[currentRiwaya][surahIndex] : 7;
                for (let ayahIndex = 0; ayahIndex < totalAyatsForSurah; ayahIndex++) {
                    progressData[currentRiwaya][surahIndex][ayahIndex] = {
                        status: 'disable'
                    };
                }
            }
        }

        // حفظ ملف progressData المحدث بالكامل داخل IndexedDB
        await storeDataInDB(db, "userProgress.json", progressData);

        console.log("تم تحديث وفظ البيانات بنجاح في IndexedDB.");
        alert(`تم الحفظ بنجاح! عدد السور المفعلة: ${activeSurahsCount}`);

    } catch (error) {
        console.error("خطأ أثناء عملية الحفظ في IndexedDB:", error);
        alert("حدث خطأ أثناء حفظ الإعدادات في قاعدة البيانات.");
    }

    // العودة للقائمة الرئيسية
    showMainButtons();
}