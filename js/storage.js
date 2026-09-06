// ==========================================
// ملف التخزين وإدارة البيانات المركزي (storage.js)
// ==========================================

const DB_NAME = "IbnBadisQuranDB";
const STORE_NAME = "quranStore";
const DB_VERSION = 1;

// روابط ملفات قاعدة البيانات من GitHub
const GITHUB_FILES = {
    "ayah_difficulties.json": "https://raw.githubusercontent.com/techniquepuits/quran/main/IbnBadisQuranDB/ayah_difficulties.json",
    "ayah_last_reviews.json": "https://raw.githubusercontent.com/techniquepuits/quran/main/IbnBadisQuranDB/ayah_last_reviews.json",
    "ayah_statuses.json": "https://raw.githubusercontent.com/techniquepuits/quran/main/IbnBadisQuranDB/ayah_statuses.json",
    "ayah_texts.json": "https://raw.githubusercontent.com/techniquepuits/quran/main/IbnBadisQuranDB/ayah_texts.json",
    "ayah_word_counts.json": "https://raw.githubusercontent.com/techniquepuits/quran/main/IbnBadisQuranDB/ayah_word_counts.json",
    "user_app_config.json": "https://raw.githubusercontent.com/techniquepuits/quran/main/IbnBadisQuranDB/user_app_config.json"
};

/**
 * دالة أساسية لفتح قاعدة البيانات IndexedDB
 */
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = (event) => reject("فشل فتح قاعدة البيانات: " + event.target.error);
        request.onsuccess = (event) => resolve(event.target.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}

// ==========================================
// دوال التشغيل الأساسية (البداية وإدارة الإعدادات)
// ==========================================
async function handleStartAppProcess() {
    const container = document.getElementById('main-container');
    if (container) {
        container.innerHTML = `
            <div class="welcome-container" style="text-align: center; padding-top: 50px;">
                <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #1b4d3e; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 20px auto;"></div>
                <div class="app-title" style="font-size: 22px;">جاري تجهيز وتحميل المصحف...</div>
                <div class="app-slogan">يتم جلب البيانات للذاكرة لتشغيل فوري بدون أي انتظار</div>
            </div>
            <style>
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
        `;
    }

    try {
        const db = await openDatabase();
        const hasData = await checkDataExistsInDB(db, "ayah_texts.json");

        if (!hasData) {
            console.log("البيانات غير موجودة، جاري جلبها من GitHub وتخزينها...");
            for (const [fileName, fileUrl] of Object.entries(GITHUB_FILES)) {
                const response = await fetch(fileUrl);
                if (!response.ok) throw new Error(`تعذر جلب الملف: ${fileName}`);
                const fileData = await response.json();
                await storeDataInDB(db, fileName, fileData);
            }
        } else {
            console.log("البيانات مخزنة مسبقاً، سيتم تحميلها للذاكرة الحية مباشرة...");
        }

        // سحب البيانات من IndexedDB إلى الذاكرة الحية
        memoryQuranTexts = await getAllFileFromDB("ayah_texts.json") || {};
        memoryQuranStatuses = await getAllFileFromDB("ayah_statuses.json") || {};
        memoryUserConfig = await getAllFileFromDB("user_app_config.json") || {};

        // مزامنة المتغيرات العامة إن وجدت في الإعدادات
        if (memoryUserConfig.riwaya !== undefined) userRiwaya = memoryUserConfig.riwaya;
        if (memoryUserConfig.dailyLearningTarget !== undefined) userCountLearningPlannedToday = memoryUserConfig.dailyLearningTarget;

        console.log("تم التحميل بنجاح، الانتقال للرئيسية.");
        showMainButtons();

    } catch (error) {
        console.error("مشكلة في جلب أو تخزين البيانات:", error);
        alert("تعذر تحميل البيانات، يرجى التحقق من الاتصال بالإنترنت.");
        showMainButtons();
    }
}


function checkDataExistsInDB(db, keyName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(keyName);
        request.onsuccess = () => resolve(request.result !== undefined);
        request.onerror = () => reject(request.error);
    });
}

function storeDataInDB(db, keyName, data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(data, keyName);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}

async function getFileFromDB(fileName) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(fileName);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveSettingsAndReturn() {
    try {
        const dailyCountEl = document.getElementById('daily-count-input');
        const newDailyTarget = dailyCountEl ? parseInt(dailyCountEl.value, 10) || 10 : 10;
        const currentRiwaya = typeof userRiwaya !== 'undefined' ? userRiwaya : 0;

        await sendDataUser("riwaya", currentRiwaya);
        await sendDataUser("dailyLearningTarget", newDailyTarget);
        if (typeof userCountLearningPlannedToday !== 'undefined') {
            userCountLearningPlannedToday = newDailyTarget;
        }

        alert("تم حفظ الإعدادات بنجاح!");
    } catch (error) {
        console.error("خطأ أثناء حفظ الإعدادات:", error);
        alert("حدث خطأ أثناء حفظ الإعدادات.");
    }
    showMainButtons();
}


// ==========================================
// الدوال الأربع الأساسية المعتمدة للجلب والتخزين
// ==========================================

/**
 * 1. دالة الجلب العامة (getData) للملفات العميقة
 */
async function getData(recordKey, i, j, k) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(recordKey);

        request.onsuccess = (event) => {
            db.close();
            const data = event.target.result;
            if (!data) return reject(`لا توجد بيانات مسجلة تحت المفتاح "${recordKey}".`);

            try {
                const propertyName = recordKey.replace('.json', '');
                const targetArray = data[propertyName] || data;
                const resultValue = targetArray[i]?.[j]?.[k];
                
                if (resultValue !== undefined) {
                    resolve(resultValue);
                } else {
                    reject("الإحداثيات المدخلة خارج حدود المصفوفة.");
                }
            } catch (err) {
                reject("خطأ في قراءة العناصر.");
            }
        };
        request.onerror = (event) => {
            db.close();
            reject("خطأ أثناء جلب البيانات: " + event.target.error);
        };
    });
}

/**
 * 2. دالة التحديث والحفظ العامة (sendData) للملفات العميقة
 */
async function sendData(recordKey, i, j, k, value) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(recordKey);

        request.onsuccess = (event) => {
            const data = event.target.result;
            if (!data) {
                db.close();
                return reject(`المفتاح "${recordKey}" غير موجود.`);
            }

            try {
                const propertyName = recordKey.replace('.json', '');
                let targetArray = data[propertyName] || data;

                if (targetArray[i] && targetArray[i][j] !== undefined) {
                    targetArray[i][j][k] = value;
                } else {
                    db.close();
                    return reject("الإحداثيات خارج حدود المصفوفة.");
                }

                const updateRequest = store.put(data, recordKey);
                updateRequest.onsuccess = () => {
                    db.close();
                    resolve("تم الحفظ بنجاح.");
                };
                updateRequest.onerror = (err) => {
                    db.close();
                    reject("فشل الحفظ: " + err.target.error);
                };
            } catch (err) {
                db.close();
                reject("خطأ أثناء معالجة المصفوفة.");
            }
        };
        request.onerror = (event) => {
            db.close();
            reject("خطأ في جلب السجل: " + event.target.error);
        };
    });
}

/**
 * 3. دالة جلب إعدادات المستخدم (getDataUser)
 */
async function getDataUser(propertyName) {
    const db = await openDatabase();
    const recordKey = "user_app_config.json";

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(recordKey);

        request.onsuccess = (event) => {
            db.close();
            const configData = event.target.result;
            if (!configData) return reject("ملف الإعدادات غير موجود.");

            if (propertyName in configData) {
                resolve(configData[propertyName]);
            } else {
                reject(`الخاصية "${propertyName}" غير موجودة.`);
            }
        };
        request.onerror = (event) => {
            db.close();
            reject("خطأ أثناء قراءة الإعدادات.");
        };
    });
}

/**
 * 4. دالة تحديث إعدادات المستخدم (sendDataUser)
 */
async function sendDataUser(propertyName, value) {
    const db = await openDatabase();
    const recordKey = "user_app_config.json";

    if (propertyName === "last_review_date") {
        const now = new Date();
        value = now.toISOString().split('T')[0];
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(recordKey);

        request.onsuccess = (event) => {
            let configData = event.target.result;
            if (!configData) {
                db.close();
                return reject("ملف الإعدادات غير موجود.");
            }

            configData[propertyName] = (!isNaN(value) && String(value).trim() !== "") ? Number(value) : value;

            const updateRequest = store.put(configData, recordKey);
            updateRequest.onsuccess = () => {
                db.close();
                resolve(`تم تحديث "${propertyName}" بنجاح.`);
            };
            updateRequest.onerror = (err) => {
                db.close();
                reject("فشل الحفظ: " + err.target.error);
            };
        };
        request.onerror = (event) => {
            db.close();
            reject("خطأ أثناء جلب ملف الإعدادات.");
        };
    });
}

// جلب الملف كاملاً دفعة واحدة من قاعدة البيانات لتسريع العمليات
async function getAllFileFromDB(fileName) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(fileName);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
/*
// جلب الملف كاملاً دفعة واحدة من قاعدة البيانات لتسريع العمليات
async function getAllFileFromDB(fileName) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(fileName);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
*/