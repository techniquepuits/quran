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

// ============ محرك الدالة الأسية للتكرار المتباعد (Exponential SRS Engine) ============

/**
 * حساب الزمن المرجعي بالأيام بناءً على الدالة الأسية لمعامل الصعوبة (D من 1 إلى 10)
 * T_ref(D) = 30 ^ ((10 - D) / 9)
 */
function calculateReferenceTime(difficulty) {
    let D = Math.max(1.0, Math.min(10.0, difficulty));
    return Math.pow(30, (10 - D) / 9);
}

/**
 * تحديث معامل الصعوبة بناءً على تقييم المستخدم
 */
function calculateNewDifficulty(oldDifficulty, userChoice) {
    // التقييمات: forgot (نسيت), hard (صعب), good (جيد), easy (سهل)
    const targets = { forgot: 10.0, hard: 8.0, good: 4.0, easy: 1.0 };
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

/**
 * توليد طابور المراجعة اليومي بناءً على معامل الاستحقاق (Urgency Score - U)
 */
function generateDailyReviewQueue(learningItems, dailyQuota, newItemsQuota) {
    const now = Date.now();

    let newItemsQueueRaw = [];
    let dueEvaluatedItems = [];

    learningItems.forEach(item => {
        const anchor = item.ayasObj[item.anchorKey];
        if (!anchor) return;

        // إذا كانت الآية جديدة كلياً ولم تُراجع قط
        if (anchor.lastReviewed === null || anchor.lastReviewed === undefined) {
            newItemsQueueRaw.push(item);
            return;
        }

        // 1. حساب الزمن المنقضي بالأيام منذ آخر مراجعة
        let elapsedDays = (now - anchor.lastReviewed) / MS_PER_DAY;

        // 2. حساب الزمن المرجعي T_ref باستخدام الدالة الأسية اعتماداً على الصعوبة D
        let currentDifficulty = typeof anchor.difficulty === 'number' ? anchor.difficulty : 5.0;
        let tRef = calculateReferenceTime(currentDifficulty);

        // 3. حساب معامل الاستحقاق (Urgency Score: U)
        let urgencyScore = elapsedDays / tRef;

        // إرفاق النتيجة للعنصر
        item.urgencyScore = urgencyScore;
        item.calculatedTRef = tRef;

        // تصفية الآيات التي بلغ أو تجاوز وقت استحقاقها (U >= 1.0)
        if (urgencyScore >= 1.0) {
            dueEvaluatedItems.push(item);
        }
    });

    // سحب الحصة المخصصة للآيات الجديدة وعشوائيتها
    shuffleArray(newItemsQueueRaw);
    let selectedNewItems = newItemsQueueRaw.slice(0, newItemsQuota);

    // ترتيب الآيات المستحقة تنازلياً حسب قيمة معامل الاستحقاق U (الأكثر إلحاحاً يظهر أولاً بغض النظر عن الصعوبة)
    dueEvaluatedItems.sort((a, b) => b.urgencyScore - a.urgencyScore);

    // سحب العدد المطلوب لجلسة اليوم (dailyQuota) من الآيات المستحقة
    let selectedDueItems = dueEvaluatedItems.slice(0, dailyQuota);

    // الدمج النهائي للطابور اليومي (الآيات الجديدة أولاً أو المراجعات بحسب الترتيب المفضل)
    let finalQueue = [...selectedNewItems, ...selectedDueItems];

    return {
        queue: finalQueue,
        newItemsCount: selectedNewItems.length,
        dueCount: selectedDueItems.length,
        hasExtreme: false // تم الاستغناء عنها لصالح المنظومة الأسية الموحدة
    };
}
