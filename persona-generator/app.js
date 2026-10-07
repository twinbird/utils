document.addEventListener('DOMContentLoaded', () => {
  const genderSelect = document.getElementById('gender-select');
  const ageGroupSelect = document.getElementById('age-group-select');
  const generateBtn = document.getElementById('generate-btn');
  const copyJsonBtn = document.getElementById('copy-json-btn');
  const copyTextBtn = document.getElementById('copy-text-btn');
  const toast = document.getElementById('toast');

  const fieldElements = {
    name: document.getElementById('name'),
    kana: document.getElementById('kana'),
    gender: document.getElementById('gender'),
    birthdate: document.getElementById('birthdate'),
    zipcode: document.getElementById('zipcode'),
    address: document.getElementById('address'),
    phone: document.getElementById('phone'),
    email: document.getElementById('email'),
    occupation: document.getElementById('occupation'),
    password: document.getElementById('password'),
  };

  const surnames = [
    { kanji: '佐藤', kana: 'サトウ', romaji: 'sato' },
    { kanji: '鈴木', kana: 'スズキ', romaji: 'suzuki' },
    { kanji: '高橋', kana: 'タカハシ', romaji: 'takahashi' },
    { kanji: '田中', kana: 'タナカ', romaji: 'tanaka' },
    { kanji: '伊藤', kana: 'イトウ', romaji: 'ito' },
    { kanji: '渡辺', kana: 'ワタナベ', romaji: 'watanabe' },
    { kanji: '山本', kana: 'ヤマモト', romaji: 'yamamoto' },
    { kanji: '中村', kana: 'ナカムラ', romaji: 'nakamura' },
    { kanji: '小林', kana: 'コバヤシ', romaji: 'kobayashi' },
    { kanji: '加藤', kana: 'カトウ', romaji: 'kato' },
    { kanji: '吉田', kana: 'ヨシダ', romaji: 'yoshida' },
    { kanji: '山田', kana: 'ヤマダ', romaji: 'yamada' },
    { kanji: '佐々木', kana: 'ササキ', romaji: 'sasaki' },
    { kanji: '山口', kana: 'ヤマグチ', romaji: 'yamaguchi' },
    { kanji: '松本', kana: 'マツモト', romaji: 'matsumoto' },
    { kanji: '井上', kana: 'イノウエ', romaji: 'inoue' },
    { kanji: '木村', kana: 'キムラ', romaji: 'kimura' },
    { kanji: '林', kana: 'ハヤシ', romaji: 'hayashi' },
    { kanji: '齋藤', kana: 'サイトウ', romaji: 'saito' },
    { kanji: '清水', kana: 'シミズ', romaji: 'shimizu' },
  ];

  const maleGivenNames = [
    { kanji: '翔太', kana: 'ショウタ', romaji: 'shota' },
    { kanji: '健太', kana: 'ケンタ', romaji: 'kenta' },
    { kanji: '拓海', kana: 'タクミ', romaji: 'takumi' },
    { kanji: '大輝', kana: 'ダイキ', romaji: 'daiki' },
    { kanji: '蓮', kana: 'レン', romaji: 'ren' },
    { kanji: '陸', kana: 'リク', romaji: 'riku' },
    { kanji: '悠斗', kana: 'ユウト', romaji: 'yuto' },
    { kanji: '誠', kana: 'マコト', romaji: 'makoto' },
    { kanji: '大輔', kana: 'ダイスケ', romaji: 'daisuke' },
    { kanji: '直樹', kana: 'ナオキ', romaji: 'naoki' },
    { kanji: '洋平', kana: 'ヨウヘイ', romaji: 'yohei' },
    { kanji: '竜也', kana: 'タツヤ', romaji: 'tatsuya' },
  ];

  const femaleGivenNames = [
    { kanji: '陽菜', kana: 'ヒナ', romaji: 'hina' },
    { kanji: '葵', kana: 'アオイ', romaji: 'aoi' },
    { kanji: '美咲', kana: 'ミサキ', romaji: 'misaki' },
    { kanji: 'さくら', kana: 'サクラ', romaji: 'sakura' },
    { kanji: '結衣', kana: 'ユイ', romaji: 'yui' },
    { kanji: '七海', kana: 'ナナミ', romaji: 'nanami' },
    { kanji: '彩香', kana: 'アヤカ', romaji: 'ayaka' },
    { kanji: '愛', kana: 'アイ', romaji: 'ai' },
    { kanji: '真緒', kana: 'マオ', romaji: 'mao' },
    { kanji: '千尋', kana: 'チヒロ', romaji: 'chihiro' },
    { kanji: '麻衣', kana: 'マイ', romaji: 'mai' },
    { kanji: '優花', kana: 'ユウカ', romaji: 'yuka' },
  ];

  const addresses = [
    {
      zip: '100-0001',
      pref: '東京都',
      city: '千代田区',
      town: '千代田',
      banchi: '1-1',
      building: '千代田ハイツ101号室',
    },
    {
      zip: '105-0004',
      pref: '東京都',
      city: '港区',
      town: '新橋',
      banchi: '2-16-1',
      building: 'ニュー新橋ビル402',
    },
    {
      zip: '160-0022',
      pref: '東京都',
      city: '新宿区',
      town: '新宿',
      banchi: '3-14-1',
      building: '新宿グランドタワー501',
    },
    {
      zip: '220-0011',
      pref: '神奈川県',
      city: '横浜市西区',
      town: '高島',
      banchi: '2-19-12',
      building: '横浜スカイマンション305',
    },
    {
      zip: '330-0854',
      pref: '埼玉県',
      city: 'さいたま市大宮区',
      town: '桜木町',
      banchi: '1-7-5',
      building: '大宮ソニックレジデンス801',
    },
    {
      zip: '260-0013',
      pref: '千葉県',
      city: '千葉市中央区',
      town: '中央',
      banchi: '1-11-1',
      building: '千葉セントラルハイツ203',
    },
    {
      zip: '460-0008',
      pref: '愛知県',
      city: '名古屋市中区',
      town: '栄',
      banchi: '3-5-12',
      building: '栄スクエアコート602',
    },
    {
      zip: '530-0001',
      pref: '大阪府',
      city: '大阪市北区',
      town: '梅田',
      banchi: '1-1-3',
      building: '大阪梅田タワー1204',
    },
    {
      zip: '600-8216',
      pref: '京都府',
      city: '京都市下京区',
      town: '烏丸通七条下ル東塩小路町',
      banchi: '721-1',
      building: '京都ステーションレジデンス401',
    },
    {
      zip: '810-0001',
      pref: '福岡県',
      city: '福岡市中央区',
      town: '天神',
      banchi: '2-11-1',
      building: '天神プライムビル703',
    },
  ];

  const emailDomains = [
    'example.com',
    'example.jp',
    'dummy-mail.jp',
    'test-user.com',
  ];

  const occupations = [
    '会社員（事務職）',
    '会社員（技術職）',
    '会社員（営業職）',
    '公務員',
    '自営業・自由業',
    '専業主婦・主夫',
    'パート・アルバイト',
    '大学生・大学院生',
    '医療・福祉関連',
  ];

  let toastTimer = null;

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('show');

    if (toastTimer) {
      window.clearTimeout(toastTimer);
    }

    toastTimer = window.setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  };

  const getRandomItem = (array) =>
    array[Math.floor(Math.random() * array.length)];

  const getRandomInt = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const generateRandomPassword = () => {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i += 1) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    return password;
  };

  const generatePhoneNumber = () => {
    const isMobile = Math.random() < 0.7;
    if (isMobile) {
      const prefixes = ['090', '080', '070'];
      const prefix = getRandomItem(prefixes);
      const mid = String(getRandomInt(1000, 9999));
      const end = String(getRandomInt(1000, 9999));
      return `${prefix}-${mid}-${end}`;
    }

    const prefix = '03';
    const mid = String(getRandomInt(1000, 9999));
    const end = String(getRandomInt(1000, 9999));
    return `${prefix}-${mid}-${end}`;
  };

  const currentPersona = {};

  const generatePersona = () => {
    let genderKey = genderSelect.value;
    if (genderKey === 'any') {
      genderKey = Math.random() < 0.5 ? 'male' : 'female';
    }

    const genderLabel = genderKey === 'male' ? '男性' : '女性';

    let ageMin = 18;
    let ageMax = 69;
    const ageGroup = ageGroupSelect.value;

    if (ageGroup === '20s') {
      ageMin = 20;
      ageMax = 29;
    } else if (ageGroup === '30s') {
      ageMin = 30;
      ageMax = 39;
    } else if (ageGroup === '40s') {
      ageMin = 40;
      ageMax = 49;
    } else if (ageGroup === '50s') {
      ageMin = 50;
      ageMax = 59;
    } else if (ageGroup === '60s') {
      ageMin = 60;
      ageMax = 69;
    }

    const age = getRandomInt(ageMin, ageMax);

    const now = new Date();
    const birthYear = now.getFullYear() - age;
    const birthMonth = getRandomInt(1, 12);
    const maxDays = new Date(birthYear, birthMonth, 0).getDate();
    const birthDay = getRandomInt(1, maxDays);

    const pad = (num) => String(num).padStart(2, '0');
    const birthdateStr = `${birthYear}年${pad(birthMonth)}月${pad(birthDay)}日（${age}歳）`;

    const surname = getRandomItem(surnames);
    const givenName =
      genderKey === 'male'
        ? getRandomItem(maleGivenNames)
        : getRandomItem(femaleGivenNames);

    const nameKanji = `${surname.kanji} ${givenName.kanji}`;
    const nameKana = `${surname.kana} ${givenName.kana}`;

    const addr = getRandomItem(addresses);
    const fullAddress = `${addr.pref}${addr.city}${addr.town}${addr.banchi} ${addr.building}`;

    const emailUser = `${surname.romaji}.${givenName.romaji}${getRandomInt(10, 99)}`;
    const emailDomain = getRandomItem(emailDomains);
    const email = `${emailUser}@${emailDomain}`;

    const phone = generatePhoneNumber();
    const occupation = getRandomItem(occupations);
    const password = generateRandomPassword();

    currentPersona.name = nameKanji;
    currentPersona.kana = nameKana;
    currentPersona.gender = genderLabel;
    currentPersona.birthdate = birthdateStr;
    currentPersona.zipcode = addr.zip;
    currentPersona.address = fullAddress;
    currentPersona.phone = phone;
    currentPersona.email = email;
    currentPersona.occupation = occupation;
    currentPersona.password = password;

    Object.keys(fieldElements).forEach((key) => {
      if (fieldElements[key]) {
        fieldElements[key].value = currentPersona[key];
      }
    });
  };

  const copyTextToClipboard = async (text, message) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    showToast(message);
  };

  generateBtn.addEventListener('click', generatePersona);
  genderSelect.addEventListener('change', generatePersona);
  ageGroupSelect.addEventListener('change', generatePersona);

  document.querySelectorAll('.copy-field-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetKey = btn.getAttribute('data-target');
      const val = fieldElements[targetKey]
        ? fieldElements[targetKey].value
        : '';
      const labelText = btn
        .closest('.field-group')
        .querySelector('label').textContent;
      void copyTextToClipboard(val, `${labelText}をコピーしました`);
    });
  });

  copyJsonBtn.addEventListener('click', () => {
    const jsonStr = JSON.stringify(currentPersona, null, 2);
    void copyTextToClipboard(jsonStr, 'JSON形式でコピーしました');
  });

  copyTextBtn.addEventListener('click', () => {
    const formattedText = [
      `氏名（漢字）: ${currentPersona.name}`,
      `氏名（フリガナ）: ${currentPersona.kana}`,
      `性別: ${currentPersona.gender}`,
      `生年月日: ${currentPersona.birthdate}`,
      `郵便番号: ${currentPersona.zipcode}`,
      `住所: ${currentPersona.address}`,
      `電話番号: ${currentPersona.phone}`,
      `メールアドレス: ${currentPersona.email}`,
      `職業: ${currentPersona.occupation}`,
      `パスワード: ${currentPersona.password}`,
    ].join('\n');

    void copyTextToClipboard(formattedText, 'テキスト形式でコピーしました');
  });

  generatePersona();
});
