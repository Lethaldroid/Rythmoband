export const userAgent = window.navigator.userAgent;
export const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

export function getExt(url) {
    return url.trim().toLowerCase().split('.').pop();
}

export function sleep(ms = 0) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function download(url, name) {
    const elink = document.createElement('a');
    elink.style.display = 'none';
    elink.href = url;
    elink.download = name;
    document.body.appendChild(elink);
    elink.click();
    document.body.removeChild(elink);
}

export function getKeyCode(event) {
    const tag = document.activeElement.tagName.toUpperCase();
    const editable = document.activeElement.getAttribute('contenteditable');
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && editable !== '' && editable !== 'true') {
        return Number(event.keyCode);
    }
}

export function isPlaying($video) {
    return !!($video.currentTime > 0 && !$video.paused && !$video.ended && $video.readyState > 2);
}

// Decode a media file's audio track in the browser, resampled to a low rate so
// long videos stay cheap enough to draw as a waveform.
export async function decodeAudioFile(file, sampleRate = 8000) {
    const Ctx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const arrayBuffer = await file.arrayBuffer();
    const ctx = new Ctx(1, 1, sampleRate);
    return new Promise((resolve, reject) => {
        ctx.decodeAudioData(arrayBuffer, resolve, reject);
    });
}
