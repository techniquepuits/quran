const jsonUrls = {
    warsh: 'https://raw.githubusercontent.com/techniquepuits/quran/refs/heads/main/quran_warsh.json',
    hafs: 'https://raw.githubusercontent.com/techniquepuits/quran/refs/heads/main/quran_hafs.json'
};

let currentQuranData = null;
let reviewPool = []; 
let currentQuestionItem = null;
let extraPreviousCount = 0;

function getSelectedRiwaya() {
    const selected = document.querySelector('input[name="riwaya"]:checked');
    return selected ? selected.value : 'warsh';
}

async function loadQuranSurahs() {
    let riwaya = getSelectedRiwaya();
    let url = jsonUrls[riwaya];
    
    const container = document.getElementById('surahs-checkboxes-container');
    container.innerHTML = '<div style="text-align:center; padding:15px; color:#555;">جاري تحديث السور...</div>';

    try {
        let response = await fetch(url);
        let data = await response.json();
        
        currentQuranData = data.quran_warsh || data.quran_hafs || data;
        renderSurahsList();
    } catch (error) {
        console.error("خطأ في جلب بيانات القرآن:", error);
        container.innerHTML = '<div style="text-align:center; color:red; padding:15px;">فشل تحميل بيانات السور. تأكد من الاتصال بالإنترنت.</div>';
    }
}

function renderSurahsList() {
    const container = document.getElementById('surahs-checkboxes-container');
    container.innerHTML = '';

    let riwaya = getSelectedRiwaya();
    let savedConfig = JSON.parse(localStorage.getItem('surahsConfig_' + riwaya)) || {};

    Object.keys(currentQuranData).forEach(surahKey => {
        let surahObj = currentQuranData[surahKey];
        let surahName = surahObj.name;
        let ayasObj = surahObj.ayas;
        let totalAyas = Object.keys(ayasObj).length;

        let config = savedConfig[surahKey] || { active: false, limit: '' };

        let itemDiv = document.createElement('div');
        itemDiv.className = 'surah-item';

        itemDiv.innerHTML = `
            <div class="surah-info">
                <label class="switch">
                    <input type="checkbox" class="surah-toggle" data-key="${surahKey}" ${config.active ? 'checked' : ''} onchange="toggleSurahInput(this, ${totalAyas})">
                    <span class="slider"></span>
                </label>
                <span class="surah-name">${surahName} <small style="color:#64748b; font-size:12px;">(${totalAyas} آية)</small></span>
            </div>
            <div class="limit-box-wrapper" style="${!config.active ? 'display:none;' : ''}">
                <input type="text" 
                       class="surah-ayah-limit" 
                       data-key="${surahKey}" 
                       data-max="${totalAyas}" 
                       placeholder="الكل" 
                       value="${config.limit}" 
                       oninput="validateAyahInput(this, ${totalAyas})"
                       onchange="checkTotalLimit(this, ${totalAyas})">
            </div>
        `;
        container.appendChild(itemDiv);
    });
}

function toggleSurahInput(checkbox, totalAyas) {
    const row = checkbox.closest('.surah-item');
    const limitWrapper = row.querySelector('.limit-box-wrapper');
    const inputField = row.querySelector('.surah-ayah-limit');
    
    if (checkbox.checked) {
        limitWrapper.style.display = 'block';
    } else {
        limitWrapper.style.display = 'none';
        inputField.value = ''; 
    }
}

function validateAyahInput(input, maxAyas) {
    let val = input.value.replace(/\D/g, '');
    if (val !== '') {
        let num = parseInt(val, 10);
        if (num > maxAyas) {
            alert(`عذراً، عدد آيات هذه السورة هو ${maxAyas} فقط.`);
            num = maxAyas;
        } else if (num < 1) {
            num = 1;
        }
        input.value = num;
    } else {
        input.value = '';
    }
}

function checkTotalLimit(input, maxAyas) {
    let val = input.value.trim();
    if (val !== '' && parseInt(val, 10) === maxAyas) {
        input.value = ''; 
    }
}

window.addEventListener('DOMContentLoaded', () => {
    let savedRiwaya = localStorage.getItem('riwaya') || 'warsh';
    const radioToCheck = document.querySelector(`input[name="riwaya"][value="${savedRiwaya}"]`);
    if (radioToCheck) radioToCheck.checked = true;

    if(localStorage.getItem('dailyCount')) {
        document.getElementById('daily-count').value = localStorage.getItem('dailyCount');
    }

    let saveProgressSetting = localStorage.getItem('saveProgress');
    if (saveProgressSetting !== null) {
        document.getElementById('save-progress-toggle').checked = (saveProgressSetting === 'true');
    } else {
        document.getElementById('save-progress-toggle').checked = true;
    }

    loadQuranSurahs();
});

function openSettings() {
    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('settings-screen').classList.remove('hidden');
    document.getElementById('review-screen').classList.add('hidden');
    document.getElementById('settings-btn-icon').classList.add('hidden');
    document.getElementById('save-corner-btn').classList.remove('hidden');
}

function saveSettingsAndGoHome() {
    const riwaya = getSelectedRiwaya();
    const dailyCount = document.getElementById('daily-count').value;
    const saveProgress = document.getElementById('save-progress-toggle').checked;

    let surahsConfig = {};
    document.querySelectorAll('.surah-toggle').forEach(toggle => {
        let key = toggle.getAttribute('data-key');
        let row = toggle.closest('.surah-item');
        let limitInput = row.querySelector('.surah-ayah-limit');

        surahsConfig[key] = {
            active: toggle.checked,
            limit: limitInput && limitInput.value ? parseInt(limitInput.value, 10) : ''
        };
    });

    localStorage.setItem('riwaya', riwaya);
    localStorage.setItem('dailyCount', dailyCount);
    localStorage.setItem('saveProgress', saveProgress);
    localStorage.setItem('surahsConfig_' + riwaya, JSON.stringify(surahsConfig));

    document.getElementById('home-screen').classList.remove('hidden');
    document.getElementById('settings-screen').classList.add('hidden');
    document.getElementById('review-screen').classList.add('hidden');
    document.getElementById('settings-btn-icon').classList.remove('hidden');
    document.getElementById('save-corner-btn').classList.add('hidden');
}

async function startApp() {
    let riwaya = getSelectedRiwaya();
    if (!currentQuranData) {
        let response = await fetch(jsonUrls[riwaya]);
        let data = await response.json();
        currentQuranData = data.quran_warsh || data.quran_hafs || data;
    }

    let savedConfig = JSON.parse(localStorage.getItem('surahsConfig_' + riwaya)) || {};
    reviewPool = [];

    Object.keys(currentQuranData).forEach(surahKey => {
        let config = savedConfig[surahKey];
        if (config && config.active) {
            let surahObj = currentQuranData[surahKey];
            let ayasObj = surahObj.ayas;
            let ayasArray = Object.values(ayasObj);
            let limit = config.limit ? Math.min(config.limit, ayasArray.length) : ayasArray.length;

            for (let i = 0; i < limit - 1; i++) {
                reviewPool.push({
                    surahName: surahObj.name,
                    ayas: ayasArray,
                    currentIndex: i
                });
            }
        }
    });

    if (reviewPool.length === 0) {
        alert("الرجاء تفعيل سور وإدراجها من قائمة الإعدادات أولاً!");
        openSettings();
        return;
    }

    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('settings-screen').classList.add('hidden');
    document.getElementById('review-screen').classList.remove('hidden');
    document.getElementById('settings-btn-icon').classList.add('hidden');
    document.getElementById('save-corner-btn').classList.add('hidden');

    loadRandomQuestion();
}

function loadRandomQuestion() {
    if (reviewPool.length === 0) {
        alert("لقد أكملت جميع الأسئلة المتاحة في السور المفعلة!");
        saveSettingsAndGoHome();
        return;
    }

    let randomIndex = Math.floor(Math.random() * reviewPool.length);
    currentQuestionItem = reviewPool[randomIndex];
    extraPreviousCount = 0;

    updateReviewView();
    document.getElementById("show-btn").disabled = false;
}

function updateReviewView() {
    let q = currentQuestionItem;
    let currentAyah = q.ayas[q.currentIndex];
    let nextAyah = q.ayas[q.currentIndex + 1];

    document.getElementById("surah-name").innerText = "سورة: " + q.surahName;

    let prevHtml = "";
    for (let i = extraPreviousCount; i > 0; i--) {
        let idx = q.currentIndex - i;
        if (idx >= 0) {
            prevHtml += `<span class="ayah-prev">${q.ayas[idx].text}</span><span class="circle-num">${idx + 1}</span> `;
        }
    }
    document.getElementById("prev-ayahs-container").innerHTML = prevHtml;

    document.getElementById("prompt-ayah").innerText = currentAyah.text;
    document.getElementById("prompt-num").innerText = q.currentIndex + 1;

    let blankBox = document.getElementById("target-blank");
    blankBox.innerText = " " + nextAyah.text + " "; 
    blankBox.classList.remove("revealed");
    
    let targetNumElem = document.getElementById("target-num");
    targetNumElem.innerText = q.currentIndex + 2;
    targetNumElem.style.display = "inline-flex";

    document.getElementById("show-btn").classList.remove("hidden");
    document.getElementById("rating-area").classList.add("hidden");
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
    let blankBox = document.getElementById("target-blank");
    blankBox.classList.add("revealed"); 

    document.getElementById("show-btn").classList.add("hidden");
    document.getElementById("rating-area").classList.remove("hidden");
}

function nextQuestion(rating) {
    let isProgressAllowed = localStorage.getItem('saveProgress') === 'true';
    if (isProgressAllowed) {
        console.log(`تم تسجيل التقييم (${rating}) في الذاكرة بنجاح.`);
    } else {
        console.log("وضع الشرح نشط: لم يتم حفظ التقدم في الذاكرة.");
    }

    loadRandomQuestion();
}

// كود التثبيت المباشر بضغطة زر
let deferredPrompt;
const installBtn = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});

installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        let { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('تم قبول تثبيت التطبيق');
        }
        deferredPrompt = null;
    } else {
        alert('التطبيق جاهز، أو أن متصفحك قام بتثبيته مسبقاً. إذا لم تظهر نافذة التثبيت، يمكنك حفظ الموقع من خيارات المتصفح.');
    }
});