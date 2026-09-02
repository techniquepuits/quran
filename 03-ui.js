// js/03-ui.js

function loadQuranSurahsToUI() {
    let riwaya = getSelectedRiwaya();
    let storageKey = riwaya === 'hafs' ? 'quran_hafs_data' : 'quran_warsh_data';
    let currentQuranData = JSON.parse(localStorage.getItem(storageKey)) || {};

    const container = document.getElementById('surahs-checkboxes-container');
    if (!container) return;
    container.innerHTML = '';

    let settings = JSON.parse(localStorage.getItem('ibn_badis_settings')) || {};
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
            <div>
                <span style="font-size: 13px; color: #64748b; margin-left: 5px;">إلى آية:</span>
                <input type="number" id="surah-limit-${surahKey}" class="surah-ayah-limit" data-key="${surahKey}" value="${config.maxAyah}" min="1" max="${totalAyas}">
            </div>
        `;
        container.appendChild(itemDiv);
    });
}

function openSettings() {
    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('review-screen').classList.add('hidden');
    document.getElementById('settings-screen').classList.remove('hidden');
    let settingsIcon = document.getElementById('settings-btn-icon');
    let saveCornerBtn = document.getElementById('save-corner-btn');
    if(settingsIcon) settingsIcon.classList.add('hidden');
    if(saveCornerBtn) saveCornerBtn.classList.remove('hidden');
    loadSettingsToUI();
    loadQuranSurahsToUI();
}

function saveSettingsAndGoHome() {
    saveSettingsFromUI();
    returnHome();
}

function returnHome() {
    document.getElementById('settings-screen').classList.add('hidden');
    document.getElementById('review-screen').classList.add('hidden');
    document.getElementById('home-screen').classList.remove('hidden');
    let settingsIcon = document.getElementById('settings-btn-icon');
    let saveCornerBtn = document.getElementById('save-corner-btn');
    if(settingsIcon) settingsIcon.classList.remove('hidden');
    if(saveCornerBtn) saveCornerBtn.classList.add('hidden');
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

function saveSettingsFromUI() {
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
    });

    let settings = { dailyQuota, newItemsQuota, riwaya, surahsConfig };
    localStorage.setItem('ibn_badis_settings', JSON.stringify(settings));
}