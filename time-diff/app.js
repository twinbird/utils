const normalizeDateTime = (value) => {
  const match = value
    .trim()
    .match(
      /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?: (\d{1,2}):(\d{1,2}):(\d{1,2}))?$/
    );

  if (!match) {
    return null;
  }

  const [, year, month, day, hour = '0', minute = '0', second = '0'] = match;

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}`;
};

const parseDateTime = (value) => {
  const normalizedValue = normalizeDateTime(value);
  if (normalizedValue === null) {
    return null;
  }

  const match = normalizedValue.match(
    /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/
  );

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second] = match;
  const dateTime = {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
  };

  const milliseconds = Date.UTC(
    dateTime.year,
    dateTime.month - 1,
    dateTime.day,
    dateTime.hour,
    dateTime.minute,
    dateTime.second
  );
  const d = new Date(milliseconds);

  if (
    d.getUTCFullYear() !== dateTime.year ||
    d.getUTCMonth() !== dateTime.month - 1 ||
    d.getUTCDate() !== dateTime.day ||
    d.getUTCHours() !== dateTime.hour ||
    d.getUTCMinutes() !== dateTime.minute ||
    d.getUTCSeconds() !== dateTime.second
  ) {
    return null;
  }

  return milliseconds;
};

const formatDateTime = (d, dateSeparator = '-') => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  const second = String(d.getSeconds()).padStart(2, '0');

  return `${year}${dateSeparator}${month}${dateSeparator}${day} ${hour}:${minute}:${second}`;
};

const formatTimeDiff = (milliseconds) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}時間${minutes}分${seconds}秒`;
};

const formatMinuteDiff = (milliseconds) => {
  const minutes = milliseconds / (60 * 1000);

  if (Number.isInteger(minutes)) {
    return `${minutes}分`;
  }

  return `${minutes.toFixed(3).replace(/\.?0+$/, '')}分`;
};

const calculateTimeDiff = (replaceDateSeparator = false) => {
  const startDateTimeInput = document.querySelector('#start-datetime');
  const endDateTimeInput = document.querySelector('#end-datetime');
  const timeDiffOutput = document.querySelector('#time-diff-output');
  const minuteDiffOutput = document.querySelector('#minute-diff-output');

  const startDateTime = normalizeDateTime(startDateTimeInput.value);
  if (startDateTime === null) {
    alert('開始時刻の入力に誤りがあります');
    return;
  }

  const startMilliseconds = parseDateTime(startDateTime);
  if (startMilliseconds === null) {
    alert('開始時刻の入力に誤りがあります');
    return;
  }

  const endDateTime = normalizeDateTime(endDateTimeInput.value);
  if (endDateTime === null) {
    alert('終了時刻の入力に誤りがあります');
    return;
  }

  const endMilliseconds = parseDateTime(endDateTime);
  if (endMilliseconds === null) {
    alert('終了時刻の入力に誤りがあります');
    return;
  }

  if (replaceDateSeparator) {
    startDateTimeInput.value = startDateTime;
    endDateTimeInput.value = endDateTime;
  }

  const diffMilliseconds = Math.abs(endMilliseconds - startMilliseconds);
  timeDiffOutput.value = formatTimeDiff(diffMilliseconds);
  minuteDiffOutput.value = formatMinuteDiff(diffMilliseconds);
};

const initializeInput = () => {
  const startDateTimeInput = document.querySelector('#start-datetime');
  const endDateTimeInput = document.querySelector('#end-datetime');
  const currentDateTime = new Date(Math.floor(Date.now() / 1000) * 1000);
  const oneHourLaterDateTime = new Date(
    currentDateTime.getTime() + 60 * 60 * 1000
  );

  startDateTimeInput.value = formatDateTime(currentDateTime);
  endDateTimeInput.value = formatDateTime(oneHourLaterDateTime, '/');
};

document.addEventListener('DOMContentLoaded', () => {
  initializeInput();
  calculateTimeDiff();

  document
    .querySelector('#calculate-button')
    .addEventListener('click', () => calculateTimeDiff(true));
});
