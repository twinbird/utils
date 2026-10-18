document.addEventListener('DOMContentLoaded', () => {
  const sourceFile = document.getElementById('source-file');
  const convertButton = document.getElementById('convert-btn');
  const statusMessage = document.getElementById('status-message');
  const shiftJisDecoder = new TextDecoder('shift_jis', { fatal: true });

  const setStatusMessage = (message, isSuccess = false) => {
    statusMessage.textContent = message;
    statusMessage.classList.toggle('is-success', isSuccess);
  };

  const download = (text, filename) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `変換済み_${filename}`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const convert = async () => {
    const file = sourceFile.files[0];

    if (!file) {
      setStatusMessage('Shift_JIS（CP932）ファイルを選択してください。');
      return;
    }

    try {
      const text = shiftJisDecoder.decode(await file.arrayBuffer());
      download(text, file.name);
      setStatusMessage('UTF-8に変換してダウンロードしました。', true);
    } catch {
      setStatusMessage(
        'ファイルを正しいShift_JIS（CP932）として読み込めません。'
      );
    }
  };

  sourceFile.addEventListener('change', () => {
    convertButton.disabled = sourceFile.files.length === 0;
    setStatusMessage('');
  });
  convertButton.addEventListener('click', () => {
    void convert();
  });
});
