import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PREFIX = "tts_progress_v1";

// Helper method to create a unique key
function buildKey(userId, paperId, segmentId) {
    const u = userId ?? "anonymous";
    const p = paperId ?? "unknown_paper";
    const s = String(segmentId ?? "0");
    return `${KEY_PREFIX}:${u}:${p}:${s}`;
}

// saveProgress: Saves progress of the user's tts if the paper exists (for mobile)
export async function saveProgress(userId, paperId, segmentId, positionMillis) {
    try {
        const key = buildKey(userId, paperId, segmentId);
        const value = JSON.stringify({
            positionMillis: Number(positionMillis) || 0,
            updatedAt: Date.now(),
        });

        await AsyncStorage.setItem(key, value);
        return true;
    } catch (e) {
        console.warn("Error while saving progress: ", e);
        return false;
    }
}

// loadProgress: loads the progress of an existing paper's tts right where the user stopped (for mobile)
export async function loadProgress(userId, paperId, segmentId) {
    try {
        const key = buildKey(userId, paperId, segmentId);
        const data = await AsyncStorage.getItem(key);

        if (!data) return null;

        const parsedData = JSON.parse(data);
        const position = Number(parsedData?.positionMillis);

        return Number.isFinite(position) ? position : 0;
    } catch (e) {
        console.warn("Error while loading progress:", e);
        return 0;
    }
}