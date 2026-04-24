document.addEventListener('DOMContentLoaded', () => {
  const sourceText = document.getElementById('source-text');
  const resultText = document.getElementById('result-text');
  const encodeButton = document.getElementById('encode-btn');
  const decodeButton = document.getElementById('decode-btn');
  const copyButton = document.getElementById('copy-btn');
  const swapButton = document.getElementById('swap-btn');
  const statusMessage = document.getElementById('status-message');

  const setStatusMessage = (message, isSuccess = false) => {
    statusMessage.textContent = message;
    statusMessage.classList.toggle('is-success', isSuccess);
  };

  const updateActionButtons = () => {
    const hasResult = resultText.value.length > 0;
    copyButton.disabled = !hasResult;
    swapButton.disabled = !hasResult;
  };

  const encode = () => {
    if (!sourceText.value) {
      resultText.value = '';
      updateActionButtons();
      setStatusMessage('入力してください。');
      return;
    }

    resultText.value = encodeURIComponent(sourceText.value);
    updateActionButtons();
    setStatusMessage('URLエンコードしました。', true);
  };

  const decode = () => {
    if (!sourceText.value) {
      resultText.value = '';
      updateActionButtons();
      setStatusMessage('URLエンコード済み文字列を入力してください。');
      return;
    }

    try {
      resultText.value = decodeURIComponent(sourceText.value);
      updateActionButtons();
      setStatusMessage('URLデコードしました。', true);
    } catch {
      resultText.value = '';
      updateActionButtons();
      setStatusMessage('URLエンコード済み文字列の形式が正しくありません。');
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
