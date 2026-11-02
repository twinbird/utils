document.addEventListener('DOMContentLoaded', () => {
  const markedApi = window.marked;

  const dropArea = document.getElementById('drop-area');
  const editor = document.getElementById('editor');
  const preview = document.getElementById('preview');
  const sourceFile = document.getElementById('source-file');
  const openButton = document.getElementById('open-btn');
  const newButton = document.getElementById('new-btn');
  const saveButton = document.getElementById('save-btn');
  const fileNameLabel = document.getElementById('file-name');
  const statusMessage = document.getElementById('status-message');
  const saveModal = document.getElementById('save-modal');
  const saveFilename = document.getElementById('save-filename');
  const saveFormat = document.getElementById('save-format');
  const saveCancelButton = document.getElementById('save-cancel-btn');
  const saveConfirmButton = document.getElementById('save-confirm-btn');

  const STORAGE_KEY = 'markdown_editor_text';
  const FILENAME_KEY = 'markdown_editor_filename';
  const DEFAULT_FILENAME = '無題.md';

  const SAMPLE = [
    '# マークダウンエディタ',
    '',
    '左に **Markdown** を書くと、右にプレビューが表示されます。',
    '',
    '- ファイルはサーバーへ送信されません',
    '- 入力内容はこのブラウザーに自動保存されます',
    '- [ ] タスクリストも使えます',
    '',
    '```',
    'コードブロック',
    '```',
    '',
    '| 項目 | 内容 |',
    '| --- | --- |',
    '| 形式 | Markdown / HTML で保存可能 |',
    '',
    '```mermaid',
    'graph TD;',
    '  A[書く] --> B[プレビュー];',
    '```',
    '',
  ].join('\n');

  let currentFilename = DEFAULT_FILENAME;

  const escapeHtml = (text) =>
    text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');

  // marked はサニタイズを担わないため、最低限の対策をここで行う。
  // - 文中の生HTMLはエスケープして文字として表示する
  // - javascript: などの危険なスキームのリンクはリンクにしない
  markedApi.use({
    gfm: true,
    breaks: false,
    renderer: {
      html(token) {
        return escapeHtml(token.text);
      },
      link(token) {
        const href = (token.href || '').trim();
        if (/^(javascript|data|vbscript):/i.test(href)) {
          return this.parser.parseInline(token.tokens);
        }
        const title = token.title ? ` title="${escapeHtml(token.title)}"` : '';
        return `<a href="${escapeHtml(href)}"${title}>${this.parser.parseInline(token.tokens)}</a>`;
      },
    },
  });

  const setStatusMessage = (message, isSuccess = false) => {
    statusMessage.textContent = message;
    statusMessage.classList.toggle('is-success', isSuccess);
  };

  // mermaid は大きい（約5.5MB）ため、```mermaid ブロックがあるときだけ
  // 初回に読み込む。読み込みは一度だけ行う。
  let mermaidApi = null;
  let mermaidLoading = null;
  const ensureMermaid = () => {
    if (mermaidApi) {
      return Promise.resolve(mermaidApi);
    }
    if (!mermaidLoading) {
      mermaidLoading = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'vendor/mermaid.min.js';
        script.onload = () => {
          if (window.mermaid) {
            window.mermaid.initialize({
              startOnLoad: false,
              securityLevel: 'strict',
              suppressErrorRendering: true,
            });
            mermaidApi = window.mermaid;
            resolve(mermaidApi);
          } else {
            reject(new Error('mermaidを読み込めませんでした。'));
          }
        };
        script.onerror = () => {
          reject(new Error('mermaidを読み込めませんでした。'));
        };
        document.head.appendChild(script);
      });
    }
    return mermaidLoading;
  };

  // container 内の mermaid コードブロックを図（SVG）に置き換える。
  // 描画に失敗したブロックはコードブロックのまま残す。
  const applyMermaid = async (container, idPrefix, shouldAbort) => {
    const blocks = container.querySelectorAll('pre code.language-mermaid');
    if (blocks.length === 0) {
      return;
    }
    let api;
    try {
      api = await ensureMermaid();
    } catch {
      return;
    }
    let index = 0;
    for (const code of blocks) {
      if (shouldAbort && shouldAbort()) {
        return;
      }
      const pre = code.parentElement;
      const source = code.textContent.trim();
      const id = `${idPrefix}-${index++}`;
      try {
        const { svg } = await api.render(id, source);
        if (shouldAbort && shouldAbort()) {
          return;
        }
        const wrapper = document.createElement('div');
        wrapper.className = 'mermaid-diagram';
        wrapper.innerHTML = svg;
        pre.replaceWith(wrapper);
      } catch {
        // 失敗時に body へ残ることがある一時要素を掃除する。
        document.getElementById(`d${id}`)?.remove();
      }
    }
  };

  let renderSeq = 0;
  const render = () => {
    const seq = ++renderSeq;
    preview.innerHTML = markedApi.parse(editor.value);
    void applyMermaid(preview, `mmd-${seq}`, () => seq !== renderSeq);
  };

  const persist = () => {
    localStorage.setItem(STORAGE_KEY, editor.value);
    localStorage.setItem(FILENAME_KEY, currentFilename);
  };

  const setContent = (text, filename) => {
    editor.value = text;
    currentFilename = filename;
    fileNameLabel.textContent = filename;
    persist();
    render();
  };

  const openFile = async (file) => {
    try {
      const text = await file.text();
      setContent(text, file.name);
      setStatusMessage(`${file.name} を読み込みました。`, true);
    } catch {
      setStatusMessage('ファイルを読み込めませんでした。');
    }
  };

  const buildHtmlDocument = (title, bodyHtml) =>
    [
      '<!doctype html>',
      '<html lang="ja">',
      '<head>',
      '<meta charset="UTF-8" />',
      `<title>${escapeHtml(title)}</title>`,
      '<style>',
      'body { font-family: sans-serif; max-width: 760px; margin: 40px auto; padding: 0 16px; line-height: 1.7; }',
      'code { background: #f1f3f4; padding: 2px 5px; border-radius: 4px; }',
      'pre { background: #f6f8fa; padding: 12px; border-radius: 6px; overflow: auto; }',
      'pre code { background: none; padding: 0; }',
      'table { border-collapse: collapse; }',
      'th, td { border: 1px solid #ddd; padding: 4px 10px; }',
      'blockquote { margin-left: 0; padding-left: 12px; border-left: 4px solid #ddd; color: #555; }',
      'img { max-width: 100%; }',
      '.mermaid-diagram svg { max-width: 100%; height: auto; }',
      '</style>',
      '</head>',
      '<body>',
      bodyHtml,
      '</body>',
      '</html>',
      '',
    ].join('\n');

  const download = async () => {
    const isHtml = saveFormat.value === 'html';
    const filename = saveFilename.value.trim() || DEFAULT_FILENAME;
    let bodyHtml = '';
    if (isHtml) {
      // HTML保存時はプレビューと同じく図も描画してから書き出す。
      const container = document.createElement('div');
      container.innerHTML = markedApi.parse(editor.value);
      await applyMermaid(container, 'mmd-export');
      bodyHtml = container.innerHTML;
    }
    const content = isHtml
      ? buildHtmlDocument(filename.replace(/\.html?$/i, ''), bodyHtml)
      : editor.value;
    const blob = new Blob([content], {
      type: isHtml ? 'text/html' : 'text/markdown',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (!isHtml) {
      currentFilename = filename;
      fileNameLabel.textContent = filename;
      persist();
    }
    setStatusMessage('ダウンロードしました。', true);
  };

  const openSaveModal = () => {
    saveFormat.value = 'markdown';
    saveFilename.value = currentFilename;
    saveModal.hidden = false;
    saveFilename.focus();
    saveFilename.select();
  };

  const closeSaveModal = () => {
    saveModal.hidden = true;
  };

  editor.addEventListener('input', () => {
    persist();
    render();
  });

  editor.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      editor.setRangeText(
        '  ',
        editor.selectionStart,
        editor.selectionEnd,
        'end'
      );
      persist();
      render();
    } else if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === 's'
    ) {
      event.preventDefault();
      openSaveModal();
    }
  });

  sourceFile.addEventListener('change', () => {
    const file = sourceFile.files[0];
    if (file) {
      void openFile(file);
    }
    sourceFile.value = '';
  });

  dropArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropArea.classList.add('is-dragover');
  });
  dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('is-dragover');
  });
  dropArea.addEventListener('drop', (event) => {
    event.preventDefault();
    dropArea.classList.remove('is-dragover');
    const file = event.dataTransfer.files[0];
    if (file) {
      void openFile(file);
    }
  });

  openButton.addEventListener('click', () => {
    sourceFile.click();
  });

  newButton.addEventListener('click', () => {
    if (
      editor.value.trim() !== '' &&
      !window.confirm('現在の内容を消して新規作成しますか？')
    ) {
      return;
    }
    setContent('', DEFAULT_FILENAME);
    editor.focus();
    setStatusMessage('新規作成しました。', true);
  });

  saveButton.addEventListener('click', openSaveModal);

  // 形式を切り替えたら拡張子も合わせる。
  saveFormat.addEventListener('change', () => {
    const name = saveFilename.value.trim();
    if (saveFormat.value === 'html') {
      saveFilename.value = name.replace(/\.(md|markdown|txt)$/i, '') + '.html';
    } else if (/\.html?$/i.test(name)) {
      saveFilename.value = name.replace(/\.html?$/i, '.md');
    }
  });

  saveCancelButton.addEventListener('click', closeSaveModal);
  saveConfirmButton.addEventListener('click', () => {
    void (async () => {
      await download();
      closeSaveModal();
    })();
  });
  saveModal.addEventListener('click', (event) => {
    if (event.target === saveModal) {
      closeSaveModal();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !saveModal.hidden) {
      closeSaveModal();
    }
  });

  // 前回の内容があれば復元し、なければサンプルを表示する。
  const savedText = localStorage.getItem(STORAGE_KEY);
  const savedFilename = localStorage.getItem(FILENAME_KEY);
  if (savedText !== null) {
    editor.value = savedText;
    currentFilename = savedFilename || DEFAULT_FILENAME;
    fileNameLabel.textContent = currentFilename;
    render();
  } else {
    setContent(SAMPLE, DEFAULT_FILENAME);
  }
  editor.focus();
});
