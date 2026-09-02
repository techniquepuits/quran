// js/04-app.js

let reviewPool = [];
let currentQuestionItem = null;
let extraPreviousCount = 0;

let countBlue = 0;
let countRed = 0;
let countGreen = 0;

function startApp() {
    let settings = JSON.parse(localStorage.getItem('ibn_badis_settings')) ||
        { riwaya: 'warsh', dailyQuota: 10, newItemsQuota: 3, surahsConfig: {} };

    let riwaya = settings.riwaya || 'warsh';
    let storageKey = riwaya === 'hafs' ? 'quran_hafs_data' : 'quran_warsh_data';
    let currentQuranData = JSON.parse(localStorage.getItem(storageKey)) || {};

    let dailyQuota = settings.dailyQuota !== undefined ? settings.dailyQuota : 10;
    let newItemsQuota = settings.newItemsQuota !== undefined ? settings.newItemsQuota : 3;
    let savedConfig = settings.surahsConfig || {};

    let learningItems = [];
    Object.keys(currentQuranData).forEach(surahKey => {
        let config = savedConfig[surahKey];
        if (config && config.enabled) {
            let surahObj = currentQuranData[surahKey];
            let ayasObj = surahObj.ayas;
            let ayasKeys = Object.keys(ayasObj);
            let limit = config.maxAyah ? Math.min(config.maxAyah, ayasKeys.length) : ayasKeys.length;

            for (let i = 0; i <= limit - 3; i++) {
                learningItems.push({
                    surahKey: surahKey,
                    surahName: surahObj.name,
                    ayasKeys: ayasKeys,
                    ayasObj: ayasObj,
                    currentIndex: i,
                    anchorKey: ayasKeys[i + 1]
                });
            }
        }
    });

    if (learningItems.length === 0) {
        alert("الرجاء تفعيل سورة واحدة على الأقل تحتوي على 3 آيات من إعدادات التطبيق!");
        openSettings();
        return;
    }

    let result = generateDailyReviewQueue(learningItems, dailyQuota, newItemsQuota);

    if (result.queue.length === 0) {
        alert("لا توجد آيات مستحقة للمراجعة اليوم بحسب جدولة التكرار المتباعد. عد لاحقاً أو فعّل سوراً إضافية.");
        return;
    }

    if (result.hasExtreme) {
        alert("تنبيه: لديك " + result.extremeCount + " آية في حالة نسيان متكرر (استثنائية). ستظهر كلها اليوم فوق حصتك المعتادة — ضاعف جهدك.");
    }

    reviewPool = result.queue.map(item => Object.assign({ category: 'blue' }, item));

    countBlue = reviewPool.length;
    countRed = 0;
    countGreen = 0;
    updateCountersUI();

    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('settings-screen').classList.add('hidden');
    document.getElementById('review-screen').classList.remove('hidden');
    let settingsIcon = document.getElementById('settings-btn-icon');
    let saveCornerBtn = document.getElementById('save-corner-btn');
    if(settingsIcon) settingsIcon.classList.add('hidden');
    if(saveCornerBtn) saveCornerBtn.classList.remove('hidden');

    loadRandomQuestion();
}

function updateCountersUI() {
    document.getElementById('count-blue').innerText = countBlue;
    document.getElementById('count-red').innerText = countRed;
    document.getElementById('count-green').innerText = countGreen;
}

function loadRandomQuestion() {
    if (reviewPool.length === 0) {
        alert("تهانينا! لقد أكملت جميع بطاقات مراجعة اليوم.");
        returnHome();
        return;
    }

    let randomIndex = Math.floor(Math.random() * reviewPool.length);
    currentQuestionItem = reviewPool[randomIndex];
    extraPreviousCount = 0;

    updateReviewView();
    let showBtn = document.getElementById("show-btn");
    if(showBtn) showBtn.disabled = false;
}

function updateReviewView() {
    if (!currentQuestionItem) return;
    let q = currentQuestionItem;

    let key1 = q.ayasKeys[q.currentIndex];     
    let key2 = q.ayasKeys[q.currentIndex + 1]; 
    let key3 = q.ayasKeys[q.currentIndex + 2]; 

    let currentAyah = q.ayasObj[key1];
    let nextAyah1 = q.ayasObj[key2]; 
    let nextAyah2 = q.ayasObj[key3]; 

    let surahNameElem = document.getElementById("surah-name");
    if(surahNameElem) surahNameElem.innerText = "سورة: " + q.surahName;

    let prevHtml = "";
    for (let i = extraPreviousCount; i > 0; i--) {
        let idx = q.currentIndex - i;
        if (idx >= 0) {
            let prevKey = q.ayasKeys[idx];
            prevHtml += `<span class="ayah-prev">${q.ayasObj[prevKey].text}</span><span class="circle-num">${idx + 1}</span> `;
        }
    }
    let prevContainer = document.getElementById("prev-ayahs-container");
    if(prevContainer) prevContainer.innerHTML = prevHtml;

    let promptAyah = document.getElementById("prompt-ayah");
    if(promptAyah) promptAyah.innerText = currentAyah.text;

    let promptNum = document.getElementById("prompt-num");
    if(promptNum) promptNum.innerText = q.currentIndex + 1;

    // 1. الآية الرئيسية (الخضراء) - مخفية في البداية
    let blankBox1 = document.getElementById("target-blank-1");
    if(blankBox1) {
        blankBox1.innerText = " " + nextAyah1.text + " ";
        blankBox1.style.visibility = 'hidden';
        blankBox1.style.color = "#16a34a";
        blankBox1.style.minWidth = Math.max(120, nextAyah1.text.length * 6) + "px";
    }

    let targetNumElem1 = document.getElementById("target-num-1");
    if(targetNumElem1) {
        targetNumElem1.innerText = q.currentIndex + 2;
        targetNumElem1.classList.remove("hidden");
    }

    // 2. الآية الموالية (أول 3 كلمات حقيقية فقط مع معالجة دقيقة للمسافات والتشكيل)
    let blankBox2 = document.getElementById("target-blank-2");
    let targetNumElem2 = document.getElementById("target-num-2");

    if(blankBox2 && nextAyah2) {
        let cleanText = nextAyah2.text.trim();
        // تقسيم النص بناءً على المسافات الحقيقية واستخراج أول 3 كلمات حصراً
        let words = cleanText.split(/\s+/);
        
        let firstThreeWords = "";
        let isCompleteAyah = false;

        if (words.length <= 3) {
            firstThreeWords = cleanText;
            isCompleteAyah = true;
        } else {
            firstThreeWords = words.slice(0, 3).join(" ");
            isCompleteAyah = false;
        }
        
        let displaySuffix = isCompleteAyah ? "" : " ...";
        
        blankBox2.innerText = " " + firstThreeWords + displaySuffix + " ";
        blankBox2.style.visibility = 'hidden';
        blankBox2.style.color = "#4b5563";
        blankBox2.style.minWidth = Math.max(80, firstThreeWords.length * 8) + "px";

        if(targetNumElem2) {
            if(isCompleteAyah) {
                targetNumElem2.innerText = q.currentIndex + 3;
                targetNumElem2.classList.remove("hidden");
            } else {
                targetNumElem2.classList.add("hidden");
            }
        }
    }

    let showBtn = document.getElementById("show-btn");
    let ratingArea = document.getElementById("rating-area");
    if(showBtn) showBtn.classList.remove("hidden");
    if(ratingArea) ratingArea.classList.add("hidden");
}

function expandContext() {
    if (currentQuestionItem && currentQuestionItem.currentIndex - extraPreviousCount > 0) {
        extraPreviousCount++;
        updateReviewView();
    } else {
        alert("هذه هي الآية الأولى في السورة، لا توجد آيات قبلها.");
    }
}

function revealAnswer() {
    // عند الضغط على زر "عرض الإجابة"، نظهرهما معاً بالخصائص الصحيحة
    let blankBox1 = document.getElementById("target-blank-1");
    let blankBox2 = document.getElementById("target-blank-2");

    if(blankBox1) {
        blankBox1.style.visibility = 'visible'; // إظهار الآية الرئيسية بالأخضر
    }
    
    if(blankBox2) {
        blankBox2.style.visibility = 'visible'; // إظهار الآية الموالية بالرمادي فقط
        blankBox2.style.color = "#4b5563"; // التأكيد على بقائها رمادية حصراً
    }

    let showBtn = document.getElementById("show-btn");
    let ratingArea = document.getElementById("rating-area");
    if(showBtn) showBtn.classList.add("hidden");
    if(ratingArea) ratingArea.classList.remove("hidden");
}

function nextQuestion(rating) {
    if (!currentQuestionItem) return;

    updateAyahStatsInStorage(currentQuestionItem, rating);

    let oldCat = currentQuestionItem.category;
    if (oldCat === 'blue') countBlue--;
    else if (oldCat === 'red') countRed--;

    if (rating === 'forgot' || rating === 'hard') {
        currentQuestionItem.category = 'red';
        countRed++;
    } else {
        let index = reviewPool.indexOf(currentQuestionItem);
        if (index > -1) {
            reviewPool.splice(index, 1);
        }
        countGreen++;
    }

    updateCountersUI();
    loadRandomQuestion();
}

window.onload = function() {
    document.querySelectorAll('input[name="riwaya"]').forEach(radio => {
        radio.addEventListener('change', () => {
            loadQuranSurahsToUI();
        });
    });

    initStorageAndApp();
};