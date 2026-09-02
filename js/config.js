// js/01-config.js
/*
const jsonUrls = {
    warsh: 'https://raw.githubusercontent.com/techniquepuits/quran/refs/heads/main/quran_warsh.json',
    hafs: 'https://raw.githubusercontent.com/techniquepuits/quran/refs/heads/main/quran_hafs.json'
};
*/
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getSelectedRiwaya() {
    const selected = document.querySelector('input[name="riwaya"]:checked');
    return selected ? selected.value : 'warsh';
}

// ============ محرك الدالة الأسية ومعامل التمدد للتكرار المتباعد ============

/**
 * حساب الزمن المرجعي بالأيام بناءً على الدالة الأسية ومعامل التمدد الذي اقترحته:
 * القاعدة: الشهر الأساسي (حوالي 30 يوماً عند سهولة الآية) + (معامل التمدد × أسبوع 7 أيام)
 */
function calculateReferenceTime(difficulty, expansion = 0) {
    let D = Math.max(1.0, Math.min(10.0, difficulty));
    let baseInterval = Math.pow(30, (10 - D) / 9); // الأساس الزمني الأسي
    let expansionBonus = expansion * 7;            // كل خطوة تمدد تضيف أسبوعاً (7 أيام)
    return baseInterval + expansionBonus;
}

/**
 * تحديث معامل الصعوبة بناءً على تقييم المستخدم
 */
function calculateNewDifficulty(oldDifficulty, userChoice) {
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

        // إذا كانت الآية معطلة أو لم تُراجع قط
        if (anchor.status === 'disabled' || anchor.lastReviewed === null || anchor.lastReviewed === undefined) {
            // نأخذ فقط الآيات التي تترجم حالة التفعيل (new أو تفاعل الطالب معها)
            if (anchor.status === 'new' || anchor.status === 'learning' || anchor.status === 'review') {
                // تراجع ضمن قائمة الجديد أو غير المكتمل
            }
        }

        // إذا كانت الآية جديدة كلياً ولم تُراجع قط ولم تفعّل بعد بالشكل الصحيح
        if (anchor.lastReviewed === null || anchor.lastReviewed === undefined) {
            if (anchor.status === 'new' || anchor.status === 'disabled') {
                // تُعامل كآية جديدة إذا أردت إدراجها في طابور التفعيل
            }
        }

        // للإبقاء على منطق السحب للآيات الجديدة المحضة التي لم تراجع:
        if (anchor.lastReviewed === null || anchor.lastReviewed === undefined) {
            newItemsQueueRaw.push(item);
            return;
        }

        // 1. حساب الزمن المنقضي بالأيام منذ آخر مراجعة
        let elapsedDays = (now - anchor.lastReviewed) / MS_PER_DAY;

        // 2. جلب الصعوبة ومعامل التمدد الخاص بالآية
        let currentDifficulty = typeof anchor.difficulty === 'number' ? anchor.difficulty : 5.0;
        let currentExpansion = typeof anchor.expansion === 'number' ? anchor.expansion : 0;
        
        // 3. حساب الزمن المرجعي T_ref باستخدام الدالة الأسية + معامل التمدد
        let tRef = calculateReferenceTime(currentDifficulty, currentExpansion);

        // 4. حساب معامل الاستحقاق (Urgency Score: U)
        let urgencyScore = elapsedDays / tRef;

        item.urgencyScore = urgencyScore;
        item.calculatedTRef = tRef;

        // تصفية الآيات المستحقة للمراجعة (U >= 1.0)
        if (urgencyScore >= 1.0) {
            dueEvaluatedItems.push(item);
        }
    });

    // سحب الحصة المخصصة للآيات الجديدة وعشوائيتها
    shuffleArray(newItemsQueueRaw);
    let selectedNewItems = newItemsQueueRaw.slice(0, newItemsQuota);

    // ترتيب الآيات المستحقة تنازلياً حسب معامل الاستحقاق U
    dueEvaluatedItems.sort((a, b) => b.urgencyScore - a.urgencyScore);

    // سحب العدد المطلوب لجلسة اليوم (dailyQuota)
    let selectedDueItems = dueEvaluatedItems.slice(0, dailyQuota);

    let finalQueue = [...selectedNewItems, ...selectedDueItems];

    return {
        queue: finalQueue,
        newItemsCount: selectedNewItems.length,
        dueCount: selectedDueItems.length,
        hasExtreme: false
    };
}

