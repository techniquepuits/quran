// js/01-config.js

const jsonUrls = {
    warsh: 'https://raw.githubusercontent.com/techniquepuits/quran/refs/heads/main/quran_warsh.json',
    hafs: 'https://raw.githubusercontent.com/techniquepuits/quran/refs/heads/main/quran_hafs.json'
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getSelectedRiwaya() {
    const selected = document.querySelector('input[name="riwaya"]:checked');
    return selected ? selected.value : 'warsh';
}

// ============ محرك التكرار المتباعد (SRS Engine) ============

function getVerseCategory(difficulty) {
    if (difficulty > 9.5) return 'extreme'; 
    if (difficulty >= 6.5) return 'hard';
    if (difficulty >= 3.5) return 'medium';
    return 'easy';
}

function getMinIntervalDays(category) {
    switch (category) {
        case 'easy': return 30;
        case 'medium': return 7;
        case 'hard': return 1;
        case 'extreme': return 0;
        default: return 0;
    }
}

function calculateNewDifficulty(oldDifficulty, userChoice) {
    const targets = { forgot: 10.0, hard: 9.0, good: 5.0, easy: 1.0 };
    const target = targets.hasOwnProperty(userChoice) ? targets[userChoice] : 5.0;
    const newDifficulty = (oldDifficulty + target) / 2.0;
    return Math.max(1.0, Math.min(10.0, newDifficulty));
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function sortByWaitingFIFO(queue) {
    queue.sort((a, b) => b.waitingDuration - a.waitingDuration);
    let grouped = [];
    let i = 0;
    while (i < queue.length) {
        let j = i;
        while (j < queue.length && queue[j].waitingDuration === queue[i].waitingDuration) j++;
        let chunk = queue.slice(i, j);
        shuffleArray(chunk);
        grouped = grouped.concat(chunk);
        i = j;
    }
    return grouped;
}

function generateDailyReviewQueue(learningItems, dailyQuota, newItemsQuota) {
    const now = Date.now();

    let newItemsQueueRaw = [];
    let extremeQueue = [];
    let hardQueue = [];
    let mediumQueue = [];
    let easyQueue = [];

    learningItems.forEach(item => {
        const anchor = item.ayasObj[item.anchorKey];
        if (!anchor) return;

        if (anchor.lastReviewed === null || anchor.lastReviewed === undefined) {
            newItemsQueueRaw.push(item);
            return;
        }

        const category = getVerseCategory(anchor.difficulty);
        const minDays = getMinIntervalDays(category);
        const daysElapsed = (now - anchor.lastReviewed) / MS_PER_DAY;

        if (category === 'extreme' || daysElapsed >= minDays) {
            const dueTime = anchor.lastReviewed + (minDays * MS_PER_DAY);
            item.waitingDuration = now - dueTime;

            if (category === 'extreme') extremeQueue.push(item);
            else if (category === 'hard') hardQueue.push(item);
            else if (category === 'medium') mediumQueue.push(item);
            else easyQueue.push(item);
        }
    });

    shuffleArray(newItemsQueueRaw);
    const selectedNewItems = newItemsQueueRaw.slice(0, newItemsQuota);

    extremeQueue = sortByWaitingFIFO(extremeQueue);
    hardQueue = sortByWaitingFIFO(hardQueue);
    mediumQueue = sortByWaitingFIFO(mediumQueue);
    easyQueue = sortByWaitingFIFO(easyQueue);

    const selectedExtreme = extremeQueue;

    let targetHardCount = Math.round(dailyQuota * 0.60);
    let targetMediumCount = Math.round(dailyQuota * 0.20);
    let targetEasyCount = dailyQuota - targetHardCount - targetMediumCount;

    let selectedHard = hardQueue.splice(0, targetHardCount);
    let hardDeficit = targetHardCount - selectedHard.length;
    if (hardDeficit > 0) {
        selectedHard = selectedHard.concat(mediumQueue.splice(0, hardDeficit));
    }

    let selectedMedium = mediumQueue.splice(0, targetMediumCount);
    let mediumDeficit = targetMediumCount - selectedMedium.length;
    if (mediumDeficit > 0) {
        selectedMedium = selectedMedium.concat(easyQueue.splice(0, mediumDeficit));
    }

    let selectedEasy = easyQueue.splice(0, targetEasyCount);

    let currentTotal = selectedHard.length + selectedMedium.length + selectedEasy.length;
    let totalDeficit = dailyQuota - currentTotal;

    if (totalDeficit > 0) {
        const extraEasy = easyQueue.splice(0, totalDeficit);
        selectedEasy = selectedEasy.concat(extraEasy);
        totalDeficit -= extraEasy.length;
    }
    if (totalDeficit > 0) {
        const extraMedium = mediumQueue.splice(0, totalDeficit);
        selectedMedium = selectedMedium.concat(extraMedium);
        totalDeficit -= extraMedium.length;
    }
    if (totalDeficit > 0) {
        const extraHard = hardQueue.splice(0, totalDeficit);
        selectedHard = selectedHard.concat(extraHard);
        totalDeficit -= extraHard.length;
    }

    const finalQueue = [...selectedNewItems, ...selectedExtreme, ...selectedHard, ...selectedMedium, ...selectedEasy];

    return {
        queue: finalQueue,
        newItemsCount: selectedNewItems.length,
        extremeCount: selectedExtreme.length,
        hasExtreme: selectedExtreme.length > 0
    };
}