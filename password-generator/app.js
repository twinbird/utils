document.addEventListener('DOMContentLoaded', () => {
  const lengthInput = document.getElementById('length');
  const customCharsInput = document.getElementById('custom-chars');
  const charTypeInputs = Array.from(document.querySelectorAll('.char-type'));
  const regenerateButton = document.getElementById('regenerate-btn');
  const copyButton = document.getElementById('copy-btn');
  const resultInput = document.getElementById('result');

  const charSets = {
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers: '0123456789',
    symbols: '!@#$%^&*',
  };

  const updateCopyButton = () => {
    copyButton.disabled = resultInput.value.length === 0;
  };

  const uniqueChars = (value) =>
    Array.from(new Set(Array.from(value))).join('');

  const clampNumber = (value, min, max, fallback) => {
    const parsedValue = Number.parseInt(value, 10);

    if (!Number.isFinite(parsedValue)) {
      return fallback;
    }

    return Math.min(Math.max(parsedValue, min), max);
  };

  const getAvailableChars = () => {
    const selectedChars = charTypeInputs
      .filter((input) => input.checked)
      .map((input) => charSets[input.value])
      .join('');

    return uniqueChars(selectedChars + customCharsInput.value);
  };

  const getRandomIndex = (max) => {
    const maxUint32 = 0x100000000;
    const limit = maxUint32 - (maxUint32 % max);
    const randomValues = new Uint32Array(1);

    do {
      crypto.getRandomValues(randomValues);
    } while (randomValues[0] >= limit);

    return randomValues[0] % max;
  };

  const generatePassword = (length, availableChars) => {
    let password = '';

    for (let i = 0; i < length; i += 1) {
      password += availableChars[getRandomIndex(availableChars.length)];
    }

    return password;
  };

  const generatePasswordResult = () => {
    const availableChars = getAvailableChars();
    const length = clampNumber(lengthInput.value, 1, 256, 16);

    lengthInput.value = String(length);

    if (!availableChars) {
      resultInput.value = '';
      updateCopyButton();
      return;
    }

    resultInput.value = generatePassword(length, availableChars);
    updateCopyButton();
  };

  const copyResult = async () => {
    if (!resultInput.value) {
      return;
    }

    await navigator.clipboard.writeText(resultInput.value);
  };

  lengthInput.addEventListener('input', generatePasswordResult);
  customCharsInput.addEventListener('input', generatePasswordResult);
  charTypeInputs.forEach((input) => {
    input.addEventListener('change', generatePasswordResult);
  });
  regenerateButton.addEventListener('click', generatePasswordResult);
  copyButton.addEventListener('click', () => {
    void copyResult();
  });

  updateCopyButton();
  generatePasswordResult();
});
