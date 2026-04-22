const normalizeColumnName = (value) => {
  return value.replace(/\s+/g, '').toUpperCase();
};

const normalizeColumnNumber = (value) => {
  return value.replace(/\s+/g, '');
};

const convertColumnNameToNumber = (columnName) => {
  let result = 0;

  for (const char of columnName) {
    result = result * 26 + (char.charCodeAt(0) - 64);
  }

  return result;
};

const convertColumnNumberToName = (columnNumber) => {
  let value = columnNumber;
  let result = '';

  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }

  return result;
};

const updateColumnNumberOutput = () => {
  const columnNameInput = document.querySelector('#column-name-input');
  const columnNumberOutput = document.querySelector('#column-number-output');
  const normalizedColumnName = normalizeColumnName(columnNameInput.value);

  columnNameInput.value = normalizedColumnName;

  if (!/^[A-Z]+$/.test(normalizedColumnName)) {
    columnNumberOutput.value = '';
    return;
  }

  columnNumberOutput.value = String(
    convertColumnNameToNumber(normalizedColumnName)
  );
};

const updateColumnNameOutput = () => {
  const columnNumberInput = document.querySelector('#column-number-input');
  const columnNameOutput = document.querySelector('#column-name-output');
  const normalizedColumnNumber = normalizeColumnNumber(columnNumberInput.value);

  columnNumberInput.value = normalizedColumnNumber;

  if (!/^[1-9][0-9]*$/.test(normalizedColumnNumber)) {
    columnNameOutput.value = '';
    return;
  }

  columnNameOutput.value = convertColumnNumberToName(
    Number(normalizedColumnNumber)
  );
};

document.addEventListener('DOMContentLoaded', () => {
  const columnNameInput = document.querySelector('#column-name-input');
  const columnNumberInput = document.querySelector('#column-number-input');

  columnNameInput.value = 'A';
  columnNumberInput.value = '1';

  updateColumnNumberOutput();
  updateColumnNameOutput();

  columnNameInput.addEventListener('input', updateColumnNumberOutput);
  columnNumberInput.addEventListener('input', updateColumnNameOutput);
});
