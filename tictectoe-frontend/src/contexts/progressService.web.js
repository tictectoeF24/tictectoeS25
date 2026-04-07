const KEY_PREFIX = "tts_progress_v1";

function buildKey(userId, paperId, segmentId) {
    const u = userId ?? "anon";
    
    // paperId should NEVER be null/undefined here - it should come from getProgressIds()
    // which handles all fallback logic. But add safety check.
    if (!paperId) {
        console.error('[TTS Progress] buildKey called with null paperId - this should not happen!');
        throw new Error('paperId is required for progress tracking');
    }
    
    const p = String(paperId);
    const s = String(segmentId ?? "0");
    return `${KEY_PREFIX}:${u}:${p}:${s}`;
}

// persist progress locally
export async function saveProgress(userId, paperId, segmentId, positionMillis) {
    try {
        const key = buildKey(userId, paperId, segmentId);
        const value = JSON.stringify({
            positionMillis: Number(positionMillis) || 0,
            updatedAt: Date.now(),
        });
        localStorage.setItem(key, value);
        return true;
    } catch (e) {
        console.warn("saveProgress (web) failed:", e);
        return false;
    }
}

// read persisted progress locally
export async function loadProgress(userId, paperId, segmentId) {
    try {
        const key = buildKey(userId, paperId, segmentId);
        const raw = localStorage.getItem(key);
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        const pos = Number(parsed?.positionMillis);
        return Number.isFinite(pos) ? pos : 0;
    } catch (e) {
        console.warn("loadProgress (web) failed:", e);
        return 0;
    }
}