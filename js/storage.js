// js/storage.js

const DB_NAME = 'IbnBadisQuranDB';
const DB_VERSION = 16; 
const STORE_NAME = 'quran_files';

const GITHUB_QURAN_URLS = {
    warsh: 'https://raw.githubusercontent.com/techniquepuits/quran/refs/heads/main/quran_warsh.json',
    hafs: 'https://raw.githubusercontent.com/techniquepuits/quran/refs/heads/main/quran_hafs.json'
};

const DEFAULT_SETTINGS = {
    riwaya: 'warsh',
    dailyQuota: 10,
    newItemsQuota: 3,
    surahsConfig: {}
};

function openDatabase() {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            let db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}

// دالة مساعدة عامة لجلب بيانات السور الصافية بغض النظر عن شكل الـ JSON
function extractSurahsContainer(rawObj) {
    if (!rawObj) return {};
    if (rawObj.quran_warsh) return rawObj.quran_warsh;
    if (rawObj.quran_hafs) return rawObj.quran_hafs;
    return rawObj;
}

window.getQuranFromDB = async function(riwaya) {
    let db = await openDatabase();
    let storageKey = riwaya === 'hafs' ? 'quran_hafs_full' : 'quran_warsh_full';
    return new Promise((resolve, reject) => {
        let transaction = db.transaction(STORE_NAME, 'readonly');
        let store = transaction.objectStore(STORE_NAME);
        let request = store.get(storageKey);
        request.onsuccess = () => resolve(extractSurahsContainer(request.result));
        request.onerror = () => reject(request.error);
    });
};

async function getOrInitSettings() {
    let db = await openDatabase();
    let settingsKey = 'app_settings';

    let cachedSettings = await new Promise((resolve, reject) => {
        let transaction = db.transaction(STORE_NAME, 'readonly');
        let store = transaction.objectStore(STORE_NAME);
        let request = store.get(settingsKey);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    if (cachedSettings) return cachedSettings;

    await saveSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
}

async function saveSettings(newSettings) {
    let db = await openDatabase();
    await new Promise((resolve, reject) => {
        let transaction = db.transaction(STORE_NAME, 'readwrite');
        let store = transaction.objectStore(STORE_NAME);
        let request = store.put(newSettings, 'app_settings');
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
    window.appSettings = newSettings; 
}

async function getOrDownloadData(storageKey, url) {
    let db = await openDatabase();

    let cachedData = await new Promise((resolve, reject) => {
        let transaction = db.transaction(STORE_NAME, 'readonly');
        let store = transaction.objectStore(STORE_NAME);
        let request = store.get(storageKey);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    if (cachedData) return cachedData;

    let response = await fetch(url);
    if (!response.ok) throw new Error(`فشل التحميل من الرابط: ${url}`);
    
    let jsonData = await response.json();

    await new Promise((resolve, reject) => {
        let transaction = db.transaction(STORE_NAME, 'readwrite');
        let store = transaction.objectStore(STORE_NAME);
        let request = store.put(jsonData, storageKey);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });

    return jsonData;
}

async function getOrInitProgress(riwaya, quranData) {
    let db = await openDatabase();
    let progressKey = `progress_${riwaya}`;

    let cachedProgress = await new Promise((resolve, reject) => {
        let transaction = db.transaction(STORE_NAME, 'readonly');
        let store = transaction.objectStore(STORE_NAME);
        let request = store.get(progressKey);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    if (cachedProgress) return cachedProgress;

    let rawSurahs = extractSurahsContainer(quranData);
    if (!rawSurahs || typeof rawSurahs !== 'object') {
        throw new Error(`بنية بيانات مصحف ${riwaya} غير متوافقة.`);
    }

    let progressStructure = {};

    for (let surahKey in rawSurahs) {
        let surahObj = rawSurahs[surahKey];
        if (!surahObj || typeof surahObj !== 'object') continue;

        progressStructure[surahKey] = {
            name: surahObj.name || surahKey,
            ayas: {}
        };

        let ayasObj = surahObj.ayas || {};
        for (let ayahKey in ayasObj) {
            progressStructure[surahKey].ayas[ayahKey] = {
                difficulty: 10.0,
                lastReviewed: null,
                expansion: 0,         
                status: 'disabled'    
            };
        }
    }

    await new Promise((resolve, reject) => {
        let transaction = db.transaction(STORE_NAME, 'readwrite');
        let store = transaction.objectStore(STORE_NAME);
        let request = store.put(progressStructure, progressKey);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });

    return progressStructure;
}

async function updateProgressInDB(riwaya, progressData) {
    let db = await openDatabase();
    let progressKey = `progress_${riwaya}`;
    await new Promise((resolve, reject) => {
        let transaction = db.transaction(STORE_NAME, 'readwrite');
        let store = transaction.objectStore(STORE_NAME);
        let request = store.put(progressData, progressKey);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}

window.allLoadedQurans = {};
window.allLoadedProgress = {};
window.appSettings = {}; 

async function initStorageAndApp() {
    let loadingOverlay = document.getElementById('loading-overlay');
    let loadingText = document.getElementById('loading-text');

    try {
        if (loadingText) loadingText.innerText = "جاري قراءة الإعدادات وتجهيز المصاحف وملفات التقدم...";

        window.appSettings = await getOrInitSettings();

        window.allLoadedQurans['warsh'] = await getOrDownloadData('quran_warsh_full', GITHUB_QURAN_URLS.warsh);
        window.allLoadedProgress['warsh'] = await getOrInitProgress('warsh', window.allLoadedQurans['warsh']);

        window.allLoadedQurans['hafs'] = await getOrDownloadData('quran_hafs_full', GITHUB_QURAN_URLS.hafs);
        window.allLoadedProgress['hafs'] = await getOrInitProgress('hafs', window.allLoadedQurans['hafs']);

        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }

        if (typeof loadQuranSurahsToUI === 'function') {
            loadQuranSurahsToUI();
        }

    } catch (error) {
        console.error("خطأ أثناء التهيئة:", error);
        if (loadingText) {
            loadingText.innerHTML = `<span style="color: #dc2626; direction: ltr; display: block; font-size: 12px;">خطأ: ${error.message}</span>`;
        }
    }
}

const originalLocalStorageGetItem = Storage.prototype.getItem;
Storage.prototype.getItem = function(key) {
    if (key === 'quran_warsh_data' || key === 'quran_hafs_data') {
        let currentRiwaya = window.appSettings.riwaya || 'warsh';
        let raw = window.allLoadedQurans[currentRiwaya];
        if (raw) {
            let extracted = extractSurahsContainer(raw);
            return JSON.stringify(extracted);
        }
    }
    if (key === 'ibn_badis_settings') {
        return JSON.stringify(window.appSettings);
    }
    return originalLocalStorageGetItem.call(this, key);
};

// js/storage.js (التعديل لتحديث الآية الأولى المستهدفة فقط)

async function updateAyahStatsInStorage(item, rating) {
    let currentRiwaya = window.appSettings.riwaya || 'warsh';
    
    // التأكد من تحميل بيانات التقدم الحالية
    if (!window.allLoadedProgress[currentRiwaya]) {
        let quranData = window.allLoadedQurans[currentRiwaya] || await getQuranFromDB(currentRiwaya);
        window.allLoadedProgress[currentRiwaya] = await getOrInitProgress(currentRiwaya, quranData);
    }

    let progressData = window.allLoadedProgress[currentRiwaya];

    if (progressData && progressData[item.surahKey]) {
        // نكتفي بتحديث الآية الأولى فقط (currentIndex + 1) لأنها التي راجعها الطالب بالكامل،
        // أما الآية الثانية (currentIndex + 2) فظهرت منها 3 كلمات فقط كمجرد تلميح ولا تمس إحصائياتها.
        const targetKey = item.ayasKeys[item.currentIndex + 1];

        if (targetKey) {
            let ayahProgress = progressData[item.surahKey].ayas[targetKey];
            if (ayahProgress) {
                if (ayahProgress.status === 'disabled') {
                    ayahProgress.status = 'new';
                }

                // 1. تحديث معامل الصعوبة (Difficulty)
                let oldDifficulty = typeof ayahProgress.difficulty === 'number' ? ayahProgress.difficulty : 10.0;
                if (typeof calculateNewDifficulty === 'function') {
                    ayahProgress.difficulty = calculateNewDifficulty(oldDifficulty, rating);
                }

                // 2. تحديث معامل التمدد (Expansion)
                if (rating === 'easy') {
                    ayahProgress.expansion = (ayahProgress.expansion || 0) + 1; 
                } else if (rating === 'good') {
                    ayahProgress.expansion = Math.max(0, (ayahProgress.expansion || 0)); 
                } else if (rating === 'hard' || rating === 'forgot') {
                    ayahProgress.expansion = 0; 
                }

                // 3. تحديث تاريخ المراجعة والحالة للآية المستهدفة وحدها
                ayahProgress.lastReviewed = Date.now();
                ayahProgress.status = 'learning';
            }
        }

        // حفظ التغييرات في قاعدة البيانات IndexedDB
        await updateProgressInDB(currentRiwaya, progressData);
    }
}