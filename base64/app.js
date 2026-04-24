document.addEventListener('DOMContentLoaded', () => {
  const sourceText = document.getElementById('source-text');
  const resultText = document.getElementById('result-text');
  const encodeButton = document.getElementById('encode-btn');
  const decodeButton = document.getElementById('decode-btn');
  const copyButton = document.getElementById('copy-btn');
  const swapButton = document.getElementById('swap-btn');
  const statusMessage = document.getElementById('status-message');
  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder('utf-8', { fatal: true });

  const setStatusMessage = (message, isSuccess = false) => {
    statusMessage.textContent = message;
    statusMessage.classList.toggle('is-success', isSuccess);
  };

  const updateActionButtons = () => {
    const hasResult = resultText.value.length > 0;
    copyButton.disabled = !hasResult;
    swapButton.disabled = !hasResult;
  };

  const bytesToBase64 = (bytes) => {
    let binary = '';

    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }

    return btoa(binary);
  };

  const base64ToBytes = (base64Text) => {
    const binary = atob(base64Text);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
  };

  const normalizeBase64 = (value) => value.replace(/\s/g, '');

  const isValidBase64 = (value) => {
    if (value === '' || value.length % 4 === 1) {
      return false;
    }

    return /^[A-Za-z0-9+/]*={0,2}$/.test(value);
  };

  const encode = () => {
    if (!sourceText.value) {
      resultText.value = '';
      updateActionButtons();
      setStatusMessage('入力してください。');
      return;
    }

    resultText.value = bytesToBase64(textEncoder.encode(sourceText.value));
    updateActionButtons();
    setStatusMessage('Base64へエンコードしました。', true);
  };

  const decode = () => {
    const normalizedInput = normalizeBase64(sourceText.value);

    if (!normalizedInput) {
      resultText.value = '';
      updateActionButtons();
      setStatusMessage('Base64文字列を入力してください。');
      return;
    }

    if (!isValidBase64(normalizedInput)) {
      resultText.value = '';
      updateActionButtons();
      setStatusMessage('Base64文字列の形式が正しくありません。');
      return;
    }

    try {
      resultText.value = textDecoder.decode(base64ToBytes(normalizedInput));
      updateActionButtons();
      setStatusMessage('Base64をデコードしました。', true);
    } catch {
      resultText.value = '';
      updateActionButtons();
      setStatusMessage('UTF-8テキストとしてデコードできません。');
    }
  };

  const copyResult = async () => {
    if (!resultText.value) {
      setStatusMessage('コピーする結果がありません。');
      return;
    }

    await navigator.clipboard.writeText(resultText.value);
    setStatusMessage('結果をコピーしました。', true);
  };

  const swapResult = () => {
    if (!resultText.value) {
      setStatusMessage('入力へ移す結果がありません。');
      return;
    }

    sourceText.value = resultText.value;
    resultText.value = '';
    updateActionButtons();
    setStatusMessage('結果を入力へ移しました。', true);
  };

  encodeButton.addEventListener('click', encode);
  decodeButton.addEventListener('click', decode);
  copyButton.addEventListener('click', () => {
    void copyResult();
  });
  swapButton.addEventListener('click', swapResult);

  updateActionButtons();
});
