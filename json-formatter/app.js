document.addEventListener('DOMContentLoaded', () => {
  const jsonInput = document.getElementById('json-input');
  const indentType = document.getElementById('indent-type');
  const indentSize = document.getElementById('indent-size');
  const formatButton = document.getElementById('format-btn');
  const copyButton = document.getElementById('copy-btn');
  const jsonOutput = document.getElementById('json-output');
  const statusMessage = document.getElementById('status-message');
  const sampleJson =
    '{"name":"sample","enabled":true,"count":3,"tags":["json","format","tool"],' +
    '"settings":{"indent":"space","size":2},"items":[{"id":1,"label":"first"},' +
    '{"id":2,"label":"second"}]}';

  const setStatusMessage = (message, isSuccess = false) => {
    statusMessage.textContent = message;
    statusMessage.classList.toggle('is-success', isSuccess);
  };

  const updateIndentSizeState = () => {
    indentSize.disabled = indentType.value === 'tab';
  };

  const getIndentValue = () => {
    if (indentType.value === 'tab') {
      return '\t';
    }

    return ' '.repeat(Number(indentSize.value));
  };

  const formatJson = () => {
    const input = jsonInput.value.trim();

    if (!input) {
      jsonOutput.value = '';
      copyButton.disabled = true;
      setStatusMessage('JSONを入力してください。');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      jsonOutput.value = JSON.stringify(parsed, null, getIndentValue());
      copyButton.disabled = false;
      setStatusMessage('JSONを整形しました。', true);
    } catch {
      jsonOutput.value = '';
      copyButton.disabled = true;
      setStatusMessage('JSONの形式が正しくありません。');
    }
  };

  const copyResult = async () => {
    if (!jsonOutput.value) {
      setStatusMessage('コピーする結果がありません。');
      return;
    }

    await navigator.clipboard.writeText(jsonOutput.value);
    setStatusMessage('結果をコピーしました。', true);
  };

  indentType.addEventListener('change', updateIndentSizeState);
  formatButton.addEventListener('click', formatJson);
  copyButton.addEventListener('click', () => {
    void copyResult();
  });

  copyButton.disabled = true;
  jsonInput.value = sampleJson;
  updateIndentSizeState();
});
