// JSTのDATETIME形式文字列を返す
const getJSTDateTime = (d) => {
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Tokyo',
    hour12: false
  });

  const parts = formatter.formatToParts(d);
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  const hour = parts.find(p => p.type === 'hour').value;
  const minute = parts.find(p => p.type === 'minute').value;
  const second = parts.find(p => p.type === 'second').value;

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

// UTCのDATETIME形式文字列を返す
const getUTCDateTime = (d) => {
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

// 入力初期化処理
const initializeInput = () => {
  const d = new Date();

  // DATETIME
  const jstDateTimeInput = document.querySelector('#jst-input-datetime');
  const utcDateTimeInput = document.querySelector('#utc-input-datetime');
  jstDateTimeInput.value = getJSTDateTime(d);
  utcDateTimeInput.value = getUTCDateTime(d);
};

// JST(DATETIME)からUTC(DATETIME)へ変換ボタンをクリックした時
const jstInputDateTimeToUtcOutputDateTime = () => {
  const jstDateTimeInput = document.querySelector('#jst-input-datetime');
  const utcDateTimeOutput = document.querySelector('#utc-output-datetime');

  try {
    // NOTE: `YYYY-MM-DD HH:MM:SS`という形式はそのままDateコンストラクタに入れると環境によってUTCと解釈されたり、ローカルタイムと解釈されたりする
    //       挙動を安定させるため、JSTであることを明示するために`+09:00`を付与する
    const d = new Date(jstDateTimeInput.value + '+09:00');
    utcDateTimeOutput.value = getUTCDateTime(d);
  } catch (e) {
    alert('DATETIMEのJSTの入力に誤りがあります');
  }
};

// UTC(DATETIME)からJST(DATETIME)へ変換ボタンをクリックした時
const utcInputDateTimeToJstOutputDateTime = () => {
  const utcDateTimeInput = document.querySelector('#utc-input-datetime');
  const jstDateTimeOutput = document.querySelector('#jst-output-datetime');

  try {
    // NOTE: `YYYY-MM-DD HH:MM:SS`という形式はそのままDateコンストラクタに入れると環境によってUTCと解釈されたり、ローカルタイムと解釈されたりする
    //       挙動を安定させるため、UTCであることを明示するために`Z`を付与する
    const d = new Date(utcDateTimeInput.value + 'Z');
    jstDateTimeOutput.value = getJSTDateTime(d);
  } catch (e) {
    alert('DATETIMEのUTCの入力に誤りがあります');
  }
};

// ページ読み込み完了時
document.addEventListener("DOMContentLoaded", (event) => {
  // 入力初期化
  initializeInput();

  // JST(DATETIME)からUTC(DATETIME)へ変換ボタンをクリックした時
  document.querySelector('#btn-jst-2-utc-datetime').addEventListener('click', jstInputDateTimeToUtcOutputDateTime);

  // UTC(DATETIME)からJST(DATETIME)へ変換ボタンをクリックした時
  document.querySelector('#btn-utc-2-jst-datetime').addEventListener('click', utcInputDateTimeToJstOutputDateTime);
});
