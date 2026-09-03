// js/app.js

let reviewPool = [];
let currentQuestionItem = null;
let extraPreviousCount = 0;

let countBlue = 0;
let countRed = 0;
let countGreen = 0;

// ============ دوال التنقل بين الشاشات (مُحصّنة ومباشرة) ============

function openHelpScreen() {
    const homeScreen = document.getElementById('home-screen');
    const settingsScreen = document.getElementById('settings-screen');
    const helpScreen = document.getElementById('help-screen');
    const helpBtn = document.getElementById('help-btn-icon');

    if (homeScreen) homeScreen.classList.add('hidden');
    if (settingsScreen) settingsScreen.classList.add('hidden');
    if (helpScreen) helpScreen.classList.remove('hidden');
    if (helpBtn) helpBtn.style.display = 'none';
}

function returnHomeFromHelp() {
    const helpScreen = document.getElementById('help-screen');
    const homeScreen = document.getElementById('home-screen');
    const helpBtn = document.getElementById('help-btn-icon');

    if (helpScreen) helpScreen.classList.add('hidden');
    if (homeScreen) homeScreen.classList.remove('hidden');
    if (helpBtn) helpBtn.style.display = 'flex';
}

function openSettings() {
    const homeScreen = document.getElementById('home-screen');
    const reviewScreen = document.getElementById('review-screen');
    const settingsScreen = document.getElementById('settings-screen');
    const helpBtn = document.getElementById('help-btn-icon');
    const settingsIcon = document.getElementById('settings-btn-icon');
    const saveCornerBtn = document.getElementById('save-corner-btn');

    if (homeScreen) homeScreen.classList.add('hidden');
    if (reviewScreen) reviewScreen.classList.add('hidden');
    if (settingsScreen) settingsScreen.classList.remove('hidden');
    if (helpBtn) helpBtn.style.display = 'none';
    if (settingsIcon) settingsIcon.style.display = 'none';
    if (saveCornerBtn) saveCornerBtn.classList.remove('hidden');

    loadSettingsToUI();
    loadQuranSurahsToUI();
}

async function saveSettingsAndGoHome() {
    await saveSettingsFromUI();
    returnHome();
}

function returnHome() {
    const settingsScreen = document.getElementById('settings-screen');
    const reviewScreen = document.getElementById('review-screen');
    const homeScreen = document.getElementById('home-screen');
    const helpBtn = document.getElementById('help-btn-icon');
    const settingsIcon = document.getElementById('settings-btn-icon');
    const saveCornerBtn = document.getElementById('save-corner-btn');

    if (settingsScreen) settingsScreen.classList.add('hidden');
    if (reviewScreen) reviewScreen.classList.add('hidden');
    if (homeScreen) homeScreen.classList.remove('hidden');
    if (helpBtn) helpBtn.style.display = 'flex';
    if (settingsIcon) settingsIcon.style.display = 'flex';
    if (saveCornerBtn) saveCornerBtn.classList.add('hidden');
}

// ============ تحميل وإدارة إعدادات السور في واجهة الإعدادات ============

function loadQuranSurahsToUI() {
    let riwaya = getSelectedRiwaya();
    let storageKey = riwaya === 'hafs' ? 'quran_hafs_data' : 'quran_warsh_data';
    let currentQuranData = JSON.parse(localStorage.getItem(storageKey)) || {};

    const container = document.getElementById('surahs-checkboxes-container');
    if (!container) return;
    container.innerHTML = '';

    let settings = window.appSettings || JSON.parse(localStorage.getItem('ibn_badis_settings')) || {};
    let savedSurahsConfig = settings.surahsConfig || {};

    Object.keys(currentQuranData).forEach(surahKey => {
        let surahObj = currentQuranData[surahKey];
        let surahName = surahObj.name;
        let ayasObj = surahObj.ayas;
        let totalAyas = Object.keys(ayasObj).length;

        let config = savedSurahsConfig[surahKey] || { enabled: false, maxAyah: totalAyas };

        let itemDiv = document.createElement('div');
        itemDiv.className = 'surah-item';

        itemDiv.innerHTML = `
            <div class="surah-info">
                <label class="switch">
                    <input type="checkbox" class="surah-toggle" id="surah-check-${surahKey}" data-key="${surahKey}" ${config.enabled ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
                <label for="surah-check-${surahKey}" class="surah-name" style="cursor: pointer;">${surahName} (${totalAyas} آية)</label>
            </div>
            <div class="surah-limit-wrapper">
                <span style="font-size: 13px; color: #64748b; margin-left: 5px;">إلى آية:</span>
                <input type="number" 
                       id="surah-limit-${surahKey}" 
                       class="surah-ayah-limit" 
                       data-key="${surahKey}" 
                       value="${config.maxAyah}" 
                       min="1" 
                       max="${totalAyas}" 
                       onblur="validateAndFormatSurahLimit(this, ${totalAyas})">
                <span id="limit-label-${surahKey}" style="font-size: 12px; font-weight: bold; color: #16a34a; min-width: 60px; text-align: right;"></span>
            </div>
        `;
        container.appendChild(itemDiv);
        
        setTimeout(() => {
            let inputElem = document.getElementById(`surah-limit-${surahKey}`);
            if (inputElem) validateAndFormatSurahLimit(inputElem, totalAyas);
        }, 50);
    });
}

function loadSettingsToUI() {
    let settings = JSON.parse(localStorage.getItem('ibn_badis_settings')) || {
        dailyQuota: 10,
        newItemsQuota: 3,
        riwaya: 'warsh'
    };

    let dailyCountElem = document.getElementById('daily-count');
    let newItemsElem = document.getElementById('new-items-count');
    if (dailyCountElem) dailyCountElem.value = settings.dailyQuota;
    if (newItemsElem) newItemsElem.value = settings.newItemsQuota;

    let riwayaRadios = document.getElementsByName('riwaya');
    for (let radio of riwayaRadios) {
        if (radio.value === settings.riwaya) radio.checked = true;
    }
}

// ربط أحداث تغيير الرواية لتحديث جدول السور والآيات فوراً داخل الإعدادات
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('input[name="riwaya"]').forEach(radio => {
        radio.addEventListener('change', () => {
            if (window.appSettings) {
                window.appSettings.riwaya = getSelectedRiwaya();
            }
            loadQuranSurahsToUI(); // تحديث الجدول فوراً عند تغيير الاختيار بين ورش وحفص
        });
    });
});

async function saveSettingsFromUI() {
    let dailyQuota = parseInt(document.getElementById('daily-count')?.value) || 10;
    let newItemsQuota = parseInt(document.getElementById('new-items-count')?.value) || 3;
    let riwaya = document.querySelector('input[name="riwaya"]:checked')?.value || 'warsh';

    let surahsConfig = {};
    document.querySelectorAll('.surah-toggle').forEach(toggle => {
        let key = toggle.getAttribute('data-key');
        let row = toggle.closest('.surah-item');
        let limitInput = row.querySelector('.surah-ayah-limit');

        surahsConfig[key] = {
            enabled: toggle.checked,
            maxAyah: limitInput && limitInput.value ? parseInt(limitInput.value, 10) : 0
        };

        let progressData = window.allLoadedProgress && window.allLoadedProgress[riwaya];
        if (progressData && progressData[key]) {
            let ayasObj = progressData[key].ayas;
            let limit = surahsConfig[key].maxAyah;
            let counter = 0;
            
            Object.keys(ayasObj).forEach(ayahKey => {
                counter++;
                let ayahProg = ayasObj[ayahKey];
                if (surahsConfig[key].enabled && counter <= limit) {
                    if (ayahProg.status === 'disabled') {
                        ayahProg.status = 'new';
                    }
                } else {
                    if (ayahProg.lastReviewed === null) {
                        ayahProg.status = 'disabled';
                    }
                }
            });
        }
    });

    let settings = { dailyQuota, newItemsQuota, riwaya, surahsConfig };

    if (typeof saveSettings === 'function') {
        await saveSettings(settings);
    }

    if (typeof updateProgressInDB === 'function' && window.allLoadedProgress && window.allLoadedProgress[riwaya]) {
        await updateProgressInDB(riwaya, window.allLoadedProgress[riwaya]);
    }
}

// ============ تشغيل التطبيق وجلسة المراجعة ============

function startApp() {
    let settings = window.appSettings || JSON.parse(localStorage.getItem('ibn_badis_settings')) ||
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

    reviewPool = result.queue.map(item => Object.assign({ category: 'blue' }, item));

    countBlue = reviewPool.length;
    countRed = 0;
    countGreen = 0;
    updateCountersUI();

    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('settings-screen').classList.add('hidden');
    document.getElementById('review-screen').classList.remove('hidden');
    document.getElementById('help-btn-icon').style.display = 'none';
    
    let settingsIcon = document.getElementById('settings-btn-icon');
    let saveCornerBtn = document.getElementById('save-corner-btn');
    if(settingsIcon) settingsIcon.style.display = 'none';
    if(saveCornerBtn) saveCornerBtn.classList.remove('hidden');

    loadRandomQuestion();
}

function updateCountersUI() {
    let bElem = document.getElementById('count-blue');
    let rElem = document.getElementById('count-red');
    let gElem = document.getElementById('count-green');
    if(bElem) bElem.innerText = countBlue;
    if(rElem) rElem.innerText = countRed;
    if(gElem) gElem.innerText = countGreen;
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

    let blankBox2 = document.getElementById("target-blank-2");
    let targetNumElem2 = document.getElementById("target-num-2");

    if(blankBox2 && nextAyah2) {
        let cleanText = nextAyah2.text.trim();
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
    let blankBox1 = document.getElementById("target-blank-1");
    let blankBox2 = document.getElementById("target-blank-2");

    if(blankBox1) blankBox1.style.visibility = 'visible';
    if(blankBox2) {
        blankBox2.style.visibility = 'visible';
        blankBox2.style.color = "#4b5563";
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

function validateAndFormatSurahLimit(inputElement, totalAyas) {
    let val = parseInt(inputElement.value, 10);
    let surahKey = inputElement.getAttribute('data-key');
    let labelElem = document.getElementById(`limit-label-${surahKey}`);

    if (isNaN(val) || val <= 0) {
        val = 1;
        inputElement.value = 1;
    } else if (val > totalAyas) {
        val = totalAyas;
        inputElement.value = totalAyas;
    }

    if (val === totalAyas) {
        if (labelElem) labelElem.innerText = "(كل السورة)";
    } else {
        if (labelElem) labelElem.innerText = "";
    }
};

// ============ اختبار المقرئ (الشيخ ياسين الجزائري - البقرة: 20) ============

//************************************************************************************************************* */
// ============ تشغيل تلاوة الآية المستهدفة (النسخة الآمنة والمحدثة) ============

function playCurrentTargetAyahAudio() {
    if (!currentQuestionItem) {
        alert("لا توجد آية مستهدفة حالياً.");
        return;
    }

    let q = currentQuestionItem;
    let audioBtn = document.getElementById('play-ayah-audio-btn');

    let surahNumber = parseInt(q.surahKey.replace('surah_', ''), 10);
    let ayahNumberInSurah = q.currentIndex + 2;

    let formattedSurah = String(surahNumber).padStart(3, '0');
    let formattedAyah = String(ayahNumberInSurah).padStart(3, '0');

    // استبدال الرابط برابط بديل موثوق يدعم التوافقية الكاملة للمتصفحات
    let directAudioUrl = `https://everyayah.com/data/Alafasy_128kbps/${formattedSurah}${formattedAyah}.mp3`;

    if (audioBtn) {
        audioBtn.innerText = `🔊 جاري الاتصال بالخادم الصوتي...`;
        audioBtn.disabled = true;
    }

    let soundPlayer = new Audio();
    soundPlayer.crossOrigin = "anonymous";
    soundPlayer.src = directAudioUrl;

    soundPlayer.oncanplaythrough = () => {
        soundPlayer.play().then(() => {
            if (audioBtn) audioBtn.innerText = `🔊 تلاوة: سورة ${q.surahName} - آية ${ayahNumberInSurah}`;
        }).catch(err => {
            console.error("خطأ التشغيل:", err);
            fallbackToAlternativeAudio(q, audioBtn);
        });
    };

    soundPlayer.onerror = () => {
        console.error("فشل تحميل ملف الصوت من الخادم.");
        fallbackToAlternativeAudio(q, audioBtn);
    };

    soundPlayer.onended = () => {
        if (audioBtn) {
            audioBtn.innerText = "🔊 استمع للمقرئ (الآية المستهدفة)";
            audioBtn.disabled = false;
        }
    };
}

// دالة بديلة في حال فشل الرابط الأول
function fallbackToAlternativeAudio(q, audioBtn) {
    if (audioBtn) {
        audioBtn.innerText = "🔊 استمع للمقرئ (الآية المستهدفة)";
        audioBtn.disabled = false;
    }
    alert("تعذر تشغيل ملف الصوت للآية المحددة بسبب قيود شبكة المتصفح (CORS). يجدر التجربة عبر رفع الملفات على خادم ويب حقيقي (Hosting) بدلاً من المتصفح المحلي.");
}

// ============ تشغيل تلاوة الآية المستهدفة (النسخة النهائية الفورية) ============

function playCurrentTargetAyahAudio() {
    if (!currentQuestionItem) {
        alert("لا توجد آية مستهدفة حالياً.");
        return;
    }

    let q = currentQuestionItem;
    let audioBtn = document.getElementById('play-ayah-audio-btn');

    // استخراج رقم السورة والآية بدقة
    let surahNumber = parseInt(q.surahKey.replace(/\D/g, ''), 10);
    let ayahNumberInSurah = q.currentIndex + 2;

    let formattedSurah = String(surahNumber).padStart(3, '0');
    let formattedAyah = String(ayahNumberInSurah).padStart(3, '0');

    // رابط الآية المباشر من خوادم EveryAyah المعتمدة
    let directAudioUrl = `https://everyayah.com/data/Alafasy_128kbps/${formattedSurah}${formattedAyah}.mp3`;

    if (audioBtn) {
        audioBtn.innerText = `🔊 جاري التلاوة...`;
        audioBtn.disabled = true;
    }

    // إنشاء كائن الصوت وتشغيله مباشرة فور النقر
    let soundPlayer = new Audio();
    soundPlayer.src = directAudioUrl;
    soundPlayer.load(); // إجبار المتصفح على تحميل الملف فوراً

    let playPromise = soundPlayer.play();

    if (playPromise !== undefined) {
        playPromise.then(() => {
            if (audioBtn) {
              //  audioBtn.innerText = `🔊 تلاوة: سورة ${q.surahName} - آية ${ayahNumberInSurah}`;
            }
        }).catch(error => {
            console.error("خطأ في تشغيل الصوت:", error);
            if (audioBtn) {
                audioBtn.innerText = "🔊";
                audioBtn.disabled = false;
            }
            alert("تعذر تشغيل تلاوة هذه الآية، تأكد من اتصال الإنترنت.");
        });
    }

    soundPlayer.onended = () => {
        if (audioBtn) {
            audioBtn.innerText = "🔊";
            audioBtn.disabled = false;
        }
    };

    soundPlayer.onerror = (e) => {
        console.error("خطأ في تحميل ملف الصوت:", e);
        if (audioBtn) {
            audioBtn.innerText = "🔊";
            audioBtn.disabled = false;
        }
        alert("عذراً، ملف التلاوة لهذه الآية غير متوفر حالياً على الخادم.");
    };
}