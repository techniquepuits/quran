// js/02-storage.js

async function initStorageAndApp() {
    let loadingOverlay = document.getElementById('loading-overlay');
    let loadingText = document.getElementById('loading-text');

    try {
        if (!localStorage.getItem('quran_warsh_data')) {
            loadingText.innerText = "جاري تحميل وتثبيت مصحف ورش محلياً...";
            let res = await fetch(jsonUrls.warsh);
            let data = await res.json();
            let rawQuran = data.quran_warsh || data;
            localStorage.setItem('quran_warsh_data', JSON.stringify(formatQuranStructure(rawQuran)));
        }

        if (!localStorage.getItem('quran_hafs_data')) {
            loadingText.innerText = "جاري تحميل وتثبيت مصحف حفص محلياً...";
            let res = await fetch(jsonUrls.hafs);
            let data = await res.json();
            let rawQuran = data.quran_hafs || data;
            localStorage.setItem('quran_hafs_data', JSON.stringify(formatQuranStructure(rawQuran)));
        }

        if (!localStorage.getItem('ibn_badis_settings')) {
            let defaultSettings = {
                dailyQuota: 10,
                newItemsQuota: 3,
                riwaya: 'warsh',
                surahsConfig: {}
            };
            localStorage.setItem('ibn_badis_settings', JSON.stringify(defaultSettings));
        }

        if (loadingOverlay) loadingOverlay.classList.add('hidden');
        loadQuranSurahsToUI();

    } catch (error) {
        console.error(error);
        loadingText.innerHTML = '<span style="color: #dc2626;">فشل الاتصال لجلب المصاحف. تحقق من الإنترنت وأعد المحاولة.</span>';
    }
}

function formatQuranStructure(rawQuran) {
    let formattedQuran = {};
    Object.keys(rawQuran).forEach(surahKey => {
        let surahObj = rawQuran[surahKey];
        let formattedAyas = {};

        let ayasObj = surahObj.ayas || {};
        Object.keys(ayasObj).forEach(ayahKey => {
            let ayahText = typeof ayasObj[ayahKey] === 'object' ? ayasObj[ayahKey].text : ayasObj[ayahKey];
            formattedAyas[ayahKey] = {
                text: ayahText,
                difficulty: 10.0,
                lastReviewed: null
            };
        });

        formattedQuran[surahKey] = {
            name: surahObj.name,
            ayas: formattedAyas
        };
    });
    return formattedQuran;
}

function updateAyahStatsInStorage(item, rating) {
    let settings = JSON.parse(localStorage.getItem('ibn_badis_settings')) || { riwaya: 'warsh' };
    let storageKey = settings.riwaya === 'hafs' ? 'quran_hafs_data' : 'quran_warsh_data';
    let quranData = JSON.parse(localStorage.getItem(storageKey));

    if (quranData && quranData[item.surahKey]) {
        const now = Date.now();
        const keysToUpdate = [
            item.ayasKeys[item.currentIndex + 1],
            item.ayasKeys[item.currentIndex + 2]
        ];

        keysToUpdate.forEach(key => {
            let ayahObj = quranData[item.surahKey].ayas[key];
            if (ayahObj) {
                let oldDifficulty = typeof ayahObj.difficulty === 'number' ? ayahObj.difficulty : 10.0;
                ayahObj.difficulty = calculateNewDifficulty(oldDifficulty, rating);
                ayahObj.lastReviewed = now;
            }
        });

        localStorage.setItem(storageKey, JSON.stringify(quranData));
    }
}