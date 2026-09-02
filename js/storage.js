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

    if (cachedSettings) {
        return cachedSettings;
    }

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

    if (cachedData) {
        return cachedData;
    }

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

    if (cachedProgress) {
        return cachedProgress;
    }

    let rawSurahs = quranData.quran_warsh || quranData.quran_hafs || quranData;
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
            return JSON.stringify(raw.quran_warsh || raw.quran_hafs || raw);
        }
    }
    if (key === 'ibn_badis_settings') {
        return JSON.stringify(window.appSettings);
    }
    return originalLocalStorageGetItem.call(this, key);
};

async function updateAyahStatsInStorage(item, rating) {
    let currentRiwaya = window.appSettings.riwaya || 'warsh';
    let progressData = window.allLoadedProgress[currentRiwaya];

    if (progressData && progressData[item.surahKey]) {
        const keysToUpdate = [
            item.ayasKeys[item.currentIndex + 1],
            item.ayasKeys[item.currentIndex + 2]
        ];

        keysToUpdate.forEach(key => {
            let ayahProgress = progressData[item.surahKey].ayas[key];
            if (ayahProgress) {
                if (ayahProgress.status === 'disabled') {
                    ayahProgress.status = 'new';
                }

                if (rating === 'easy') {
                    ayahProgress.expansion += 1; 
                } else if (rating === 'good') {
                    ayahProgress.expansion = Math.max(0, ayahProgress.expansion - 1); 
                } else if (rating === 'hard' || rating === 'forgot') {
                    ayahProgress.expansion = 0; 
                }

                ayahProgress.lastReviewed = Date.now();
                ayahProgress.status = 'learning';
            }
        });

        await updateProgressInDB(currentRiwaya, progressData);
    }
}