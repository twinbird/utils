document.addEventListener('DOMContentLoaded', () => {
  const lengthInput = document.getElementById('length');
  const charType = document.getElementById('charType');
  const resultTextarea = document.getElementById('result');
  const copyBtn = document.getElementById('copyBtn');
  const copyMessage = document.getElementById('copyMessage');

  const charSets = {
    numbers: '0123456789',
    hiragana:
      'あいうえおかきくけこさしすせそたちつてと' +
      'なにぬねのはひふへほまみむめもやゆよらりるれろわをん',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  };

  const generateString = () => {
    const length = Number.parseInt(lengthInput.value, 10) || 10;
    const selectedType = charType.value;
    const charSet = charSets[selectedType];

    if (!charSet) {
      resultTextarea.value = '文字種を選択してください。';
      return;
    }

    let result = '';

    while (result.length < length) {
      result += charSet;
    }

    resultTextarea.value = result.slice(0, length);
  };

  const copyToClipboard = async () => {
    const textToCopy = resultTextarea.value;

    await navigator.clipboard.writeText(textToCopy);
    copyMessage.style.visibility = 'visible';

    window.setTimeout(() => {
      copyMessage.style.visibility = 'hidden';
    }, 1000);
  };

  lengthInput.addEventListener('input', generateString);
  charType.addEventListener('change', generateString);
  copyBtn.addEventListener('click', () => {
    void copyToClipboard();
  });

  generateString();
});
