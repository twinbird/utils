// ミリ秒の接尾辞を返す
const getMillisecondsSuffix = (d, forceMilliseconds = false) => {
  const milliseconds = d.getMilliseconds();
  if (!forceMilliseconds && milliseconds === 0) {
    return '';
  }

  return `.${String(milliseconds).padStart(3, '0')}`;
};

// JSTのDATETIME形式文字列を返す
const getJSTDateTime = (d, forceMilliseconds = false) => {
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Tokyo',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const year = parts.find((p) => p.type === 'year').value;
  const month = parts.find((p) => p.type === 'month').value;
  const day = parts.find((p) => p.type === 'day').value;
  const hour = parts.find((p) => p.type === 'hour').value;
  const minute = parts.find((p) => p.type === 'minute').value;
  const second = parts.find((p) => p.type === 'second').value;

  return `${year}-${month}-${day} ${hour}:${minute}:${second}${getMillisecondsSuffix(d, forceMilliseconds)}`;
};

// UNIXタイム文字列を返す
const getUnixTime = (d) => {
  const milliseconds = d.getTime();
  const sign = milliseconds < 0 ? '-' : '';
  const absoluteMilliseconds = Math.abs(milliseconds);
  const seconds = Math.floor(absoluteMilliseconds / 1000);
  const remainderMilliseconds = absoluteMilliseconds % 1000;

  if (remainderMilliseconds === 0) {
    return `${sign}${seconds}`;
  }

  return `${sign}${seconds}.${String(remainderMilliseconds).padStart(3, '0')}`;
};

// UNIXタイムをDateへ変換する
const parseUnixTime = (value) => {
  const normalizedValue = value.trim();
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(normalizedValue)) {
    return null;
  }

  const unixTime = Number(normalizedValue);
  if (!Number.isFinite(unixTime)) {
    return null;
  }

  const d = new Date(unixTime * 1000);
  if (Number.isNaN(d.getTime())) {
    return null;
  }

  return d;
};

// JSTのDATETIME文字列をDateへ変換する
const parseJSTDateTime = (value) => {
  const normalizedValue = value.trim();
  const match = normalizedValue.match(
    /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/
  );

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second, milliseconds = ''] = match;
  const normalizedMilliseconds =
    milliseconds === '' ? '' : `.${milliseconds.padEnd(3, '0')}`;
  const d = new Date(
    `${year}-${month}-${day}T${hour}:${minute}:${second}${normalizedMilliseconds}+09:00`
  );

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  const expectedValue =
    milliseconds === '' ? getJSTDateTime(d) : getJSTDateTime(d, true);

  return expectedValue ===
    `${year}-${month}-${day} ${hour}:${minute}:${second}${normalizedMilliseconds}`
    ? d
    : null;
};

// 入力初期化処理
const initializeInput = () => {
  const d = new Date(Math.floor(Date.now() / 1000) * 1000);

  const unixTimeInput = document.querySelector('#unix-input-time');
  const jstDateTimeInput = document.querySelector('#jst-input-datetime');
  unixTimeInput.value = getUnixTime(d);
  jstDateTimeInput.value = getJSTDateTime(d);
};

// UNIXタイムからJSTへ変換ボタンをクリックした時
const unixInputTimeToJstOutputDateTime = () => {
  const unixTimeInput = document.querySelector('#unix-input-time');
  const jstDateTimeOutput = document.querySelector('#jst-output-datetime');

  const d = parseUnixTime(unixTimeInput.value);
  if (!d) {
    alert('UNIXタイムの入力に誤りがあります');
    return;
  }

  jstDateTimeOutput.value = getJSTDateTime(d);
};

// JSTからUNIXタイムへ変換ボタンをクリックした時
const jstInputDateTimeToUnixOutputTime = () => {
  const jstDateTimeInput = document.querySelector('#jst-input-datetime');
  const unixTimeOutput = document.querySelector('#unix-output-time');

  const d = parseJSTDateTime(jstDateTimeInput.value);
  if (!d) {
    alert('DATETIMEのJSTの入力に誤りがあります');
    return;
  }

  unixTimeOutput.value = getUnixTime(d);
};

// ページ読み込み完了時
document.addEventListener('DOMContentLoaded', () => {
  // 入力初期化
  initializeInput();

  // UNIXタイムからJSTへ変換ボタンをクリックした時
  document
    .querySelector('#btn-unix-2-jst-datetime')
    .addEventListener('click', unixInputTimeToJstOutputDateTime);

  // JSTからUNIXタイムへ変換ボタンをクリックした時
  document
    .querySelector('#btn-jst-2-unix-time')
    .addEventListener('click', jstInputDateTimeToUnixOutputTime);
});
