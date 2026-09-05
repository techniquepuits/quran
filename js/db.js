// إعدادات قاعدة البيانات IndexedDB
const DB_NAME = "IbnBadisQuranDB";
const STORE_NAME = "quranStore";
const DB_VERSION = 1;

// الروابط الثلاثة المطلوبة بنفس تسميتها وهيكلتها
const GITHUB_FILES = {
    "ayatWordCount.json": "https://raw.githubusercontent.com/techniquepuits/quran/main/IbnBadisQuranDB/ayatWordCount.json",
    "quranTxt.json": "https://raw.githubusercontent.com/techniquepuits/quran/main/IbnBadisQuranDB/quranTxt.json",
    "userProgress.json": "https://raw.githubusercontent.com/techniquepuits/quran/main/IbnBadisQuranDB/userProgress.json"
};

// 1. فتح قاعدة البيانات
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}

// 2. الدالة الذكية التي تنفذ عند الضغط على "ابدأ الان"
async function handleStartAppProcess() {
    const container = document.getElementById('main-container');
    if (container) {
        container.innerHTML = `
            <div class="welcome-container" style="text-align: center;">
                <div class="app-icon" style="font-size: 40px; margin-bottom: 5px;">⏳</div>
                <div class="app-title" style="font-size: 22px;">جاري تجهيز البيانات...</div>
                <div class="app-slogan">يتم فحص وتحميل قواعد البيانات للعمل بدون إنترنت</div>
            </div>
        `;
    }

    try {
        const db = await openDatabase();
        
        // فحص هل الملف الرئيسي الأول (مثلاً quranTxt.json) مخزّن مسبقاً
        const hasData = await checkDataExistsInDB(db, "quranTxt.json");

        if (hasData) {
            console.log("البيانات مخزنة مسبقاً، الانتقال الفوري للرئيسية.");
            showMainButtons();
        } else {
            console.log("البيانات غير موجودة، جاري جلبها من GitHub...");
            
            // جلب الملفات الثلاثة دفعة واحدة
            for (const [fileName, fileUrl] of Object.entries(GITHUB_FILES)) {
                const response = await fetch(fileUrl);
                if (!response.ok) throw new Error(`تعذر جلب الملف: ${fileName}`);
                
                const fileData = await response.json();
                
                // تخزين كل ملف في IndexedDB بنفس اسم المفتاح (fileName) للحفاظ على الهيكلة
                await storeDataInDB(db, fileName, fileData);
                console.log(`تم تخزين الملف بنجاح: ${fileName}`);
            }
            
            showMainButtons();
        }
    } catch (error) {
        console.error("مشكلة في جلب أو تخزين البيانات:", error);
        alert("ملاحظة: تعذر الاتصال بالخادم لتحميل البيانات. سيتم الدخول، يرجى التأكد من الإنترنت لاحقاً.");
        showMainButtons();
    }
}

// 3. التحقق من وجود ملف معين داخل قاعدة البيانات
function checkDataExistsInDB(db, keyName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(keyName);
        request.onsuccess = () => resolve(request.result !== undefined);
        request.onerror = () => reject(request.error);
    });
}

// 4. تخزين البيانات في IndexedDB باستخدام اسم الملف مفتاحاً لها
function storeDataInDB(db, keyName, data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(data, keyName);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}

// دالة مساعدة لاحقاً لجلب أي ملف مخزن عند الحاجة إليه في التطبيق
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