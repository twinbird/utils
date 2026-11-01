// CSVの読み書きと文字コード変換を行う、DOMに依存しない純粋関数群。
window.CsvCore = (() => {
  const DELIMITERS = {
    comma: ',',
    semicolon: ';',
    tab: '\t',
  };

  const decodeBytes = (bytes, encoding) => {
    const decoder = new TextDecoder(encoding, { fatal: true });
    return decoder.decode(bytes);
  };

  // BOM → UTF-8で厳密デコード → Shift_JIS の順に推定する。
  const detectEncoding = (bytes) => {
    if (
      bytes.length >= 3 &&
      bytes[0] === 0xef &&
      bytes[1] === 0xbb &&
      bytes[2] === 0xbf
    ) {
      return 'utf-8';
    }
    if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
      return 'utf-16le';
    }
    if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
      return 'utf-16be';
    }
    try {
      decodeBytes(bytes, 'utf-8');
      return 'utf-8';
    } catch {
      return 'shift_jis';
    }
  };

  // 1行目（引用符の外）に最も多く現れる候補を区切り文字とする。
  const detectDelimiter = (text) => {
    const firstLine = text.split(/\r\n|\r|\n/, 1)[0] ?? '';
    const counts = { comma: 0, semicolon: 0, tab: 0 };
    let inQuotes = false;

    for (let i = 0; i < firstLine.length; i++) {
      const character = firstLine[i];
      if (inQuotes) {
        if (character === '"') {
          inQuotes = false;
        }
      } else if (character === '"') {
        inQuotes = true;
      } else if (character === ',') {
        counts.comma++;
      } else if (character === ';') {
        counts.semicolon++;
      } else if (character === '\t') {
        counts.tab++;
      }
    }

    let best = 'comma';
    for (const key of Object.keys(counts)) {
      if (counts[key] > counts[best]) {
        best = key;
      }
    }
    return best;
  };

  // RFC 4180 形式のCSVを string[][] に変換する。
  // セル内の引用符・区切り文字・改行に対応し、行ごとに列数をそろえる。
  const parseCsv = (text, delimiter) => {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    let fieldStarted = false;

    const pushField = () => {
      row.push(field);
      field = '';
      fieldStarted = false;
    };
    const pushRow = () => {
      pushField();
      rows.push(row);
      row = [];
    };

    for (let i = 0; i < text.length; i++) {
      const character = text[i];

      if (inQuotes) {
        if (character === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += character;
        }
        continue;
      }

      if (character === '"' && !fieldStarted) {
        inQuotes = true;
        fieldStarted = true;
      } else if (character === delimiter) {
        pushField();
      } else if (character === '\r') {
        if (text[i + 1] === '\n') {
          i++;
        }
        pushRow();
      } else if (character === '\n') {
        pushRow();
      } else {
        field += character;
        fieldStarted = true;
      }
    }

    // 末尾が改行で終わっている場合は、最後の空行を作らない。
    if (fieldStarted || field !== '' || row.length > 0) {
      pushRow();
    }

    const width = rows.reduce((max, r) => Math.max(max, r.length), 0);
    for (const r of rows) {
      while (r.length < width) {
        r.push('');
      }
    }
    return rows;
  };

  const serializeCsv = (rows, delimiter, newline) => {
    const escapeField = (field) => {
      if (
        field.includes(delimiter) ||
        field.includes('"') ||
        field.includes('\r') ||
        field.includes('\n')
      ) {
        return `"${field.replaceAll('"', '""')}"`;
      }
      return field;
    };

    return (
      rows.map((row) => row.map(escapeField).join(delimiter)).join(newline) +
      newline
    );
  };

  // shift-jis-converter と同じ SHIFT_JIS_MAP を使う。
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

  const encodeText = (text, encoding, withBom) => {
    if (encoding === 'shift_jis') {
      return encodeShiftJis(text);
    }
    const utf8 = new TextEncoder().encode(text);
    if (!withBom) {
      return utf8;
    }
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const result = new Uint8Array(bom.length + utf8.length);
    result.set(bom);
    result.set(utf8, bom.length);
    return result;
  };

  return {
    DELIMITERS,
    decodeBytes,
    detectEncoding,
    detectDelimiter,
    parseCsv,
    serializeCsv,
    encodeShiftJis,
    encodeText,
  };
})();
