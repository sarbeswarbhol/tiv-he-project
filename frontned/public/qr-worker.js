// qr-worker.js — place in /public folder
// Runs jsQR decoding off the main thread

importScripts('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js');

self.onmessage = ({ data }) => {
  const { pixels, width, height } = data;
  const code = jsQR(pixels, width, height, { inversionAttempts: 'dontInvert' });
  self.postMessage({ result: code ? code.data : null });
};