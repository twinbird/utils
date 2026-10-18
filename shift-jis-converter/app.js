document.addEventListener('DOMContentLoaded', () => {
  const sourceFile = document.getElementById('source-file');
  const convertButton = document.getElementById('convert-btn');
  const statusMessage = document.getElementById('status-message');
  const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

  const setStatusMessage = (message, isSuccess = false) => {
    statusMessage.textContent = message;
    statusMessage.classList.toggle('is-success', isSuccess);
  };

  const encodeShiftJis = (text) => {
    const bytes = [];
    const unsupported = new Set();

    for (const character of text) {
      const codePoint = character.codePointAt(0);
      const encoded = window.SHIFT_JIS_MAP[codePoint];

      if (encoded === undefined) {
        unsupported.add(character);
      } else if (encoded <= 0xff) {
        bytes.push(encoded);
      } else {
        bytes.push(encoded >> 8, encoded & 0xff);
      }
    }

    if (unsupported.size > 0) {
      const examples = [...unsupported].slice(0, 5).join('、');
      const remainder = unsupported.size > 5 ? ' など' : '';
      throw new Error(
        `Shift_JISに変換できない文字があります: ${examples}${remainder}`
      );
    }

    return new Uint8Array(bytes);
  };

  const download = (bytes, filename) => {
    const blob = new Blob([bytes], { type: 'application/octet-stream' });
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
      setStatusMessage('UTF-8ファイルを選択してください。');
      return;
    }

    try {
      const text = utf8Decoder.decode(await file.arrayBuffer());
      const bytes = encodeShiftJis(text);
      download(bytes, file.name);
      setStatusMessage(
        'Shift_JIS（CP932）に変換してダウンロードしました。',
        true
      );
    } catch (error) {
      const message =
        error instanceof TypeError
          ? 'ファイルが正しいUTF-8ではありません。'
          : error.message;
      setStatusMessage(message);
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
