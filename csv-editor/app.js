document.addEventListener('DOMContentLoaded', () => {
  const { CsvCore } = window;

  const sourceFile = document.getElementById('source-file');
  const dropArea = document.getElementById('drop-area');
  const dropPrompt = document.getElementById('drop-prompt');
  const openControls = document.getElementById('open-controls');
  const openEncoding = document.getElementById('open-encoding');
  const newButton = document.getElementById('new-btn');
  const statusMessage = document.getElementById('status-message');
  const editor = document.getElementById('editor');
  const editorToolbar = document.getElementById('editor-toolbar');
  const grid = document.getElementById('grid');
  const addRowButton = document.getElementById('add-row-btn');
  const addColButton = document.getElementById('add-col-btn');
  const downloadButton = document.getElementById('download-btn');
  const openButton = document.getElementById('open-btn');
  const saveModal = document.getElementById('save-modal');
  const saveFilename = document.getElementById('save-filename');
  const saveEncoding = document.getElementById('save-encoding');
  const saveNewline = document.getElementById('save-newline');
  const saveBom = document.getElementById('save-bom');
  const saveError = document.getElementById('save-error');
  const saveCancelButton = document.getElementById('save-cancel-btn');
  const saveConfirmButton = document.getElementById('save-confirm-btn');

  let rows = [];
  let currentDelimiter = ',';
  let editing = null;
  let currentCell = null;

  const ENCODING_LABELS = {
    'utf-8': 'UTF-8',
    shift_jis: 'Shift_JIS（CP932）',
    'utf-16le': 'UTF-16LE',
    'utf-16be': 'UTF-16BE',
  };

  const setStatusMessage = (message, isSuccess = false) => {
    statusMessage.textContent = message;
    statusMessage.classList.toggle('is-success', isSuccess);
  };

  // Excel形式の列名（A, B, ..., Z, AA, ...）を返す。
  const columnName = (index) => {
    let name = '';
    let n = index;
    do {
      name = String.fromCharCode(65 + (n % 26)) + name;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return name;
  };

  const columnCount = () =>
    rows.reduce((max, row) => Math.max(max, row.length), 0);

  const findCell = (rowIndex, colIndex) =>
    grid.querySelector(`td[data-row="${rowIndex}"][data-col="${colIndex}"]`);

  const focusCell = (rowIndex, colIndex) => {
    const clampedRow = Math.min(Math.max(rowIndex, 0), rows.length - 1);
    const clampedCol = Math.min(Math.max(colIndex, 0), columnCount() - 1);
    const cell = findCell(clampedRow, clampedCol);
    if (cell) {
      cell.focus();
    }
  };

  const stopEditing = (commit) => {
    if (!editing) {
      return;
    }
    const { rowIndex, colIndex, input, cell } = editing;
    editing = null;
    if (commit) {
      rows[rowIndex][colIndex] = input.value;
    }
    cell.textContent = rows[rowIndex][colIndex];
    cell.classList.remove('is-editing');
  };

  const startEditing = (cell, rowIndex, colIndex) => {
    stopEditing(true);
    currentCell = { row: rowIndex, col: colIndex };
    const input = document.createElement('input');
    input.type = 'text';
    input.value = rows[rowIndex][colIndex];
    cell.textContent = '';
    cell.appendChild(input);
    cell.classList.add('is-editing');
    editing = { rowIndex, colIndex, input, cell };
    input.focus();
    input.select();

    input.addEventListener('keydown', (event) => {
      // 編集中の左右キーはキャレット移動に使うため、ここでは扱わない。
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        event.stopPropagation();
        stopEditing(true);
        if (event.key === 'Enter') {
          focusCell(rowIndex + 1, colIndex);
        } else if (event.shiftKey) {
          focusCell(rowIndex, colIndex - 1);
        } else {
          focusCell(rowIndex, colIndex + 1);
        }
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        event.stopPropagation();
        stopEditing(true);
        focusCell(rowIndex + (event.key === 'ArrowUp' ? -1 : 1), colIndex);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        stopEditing(false);
        cell.focus();
      }
    });
    input.addEventListener('blur', () => {
      stopEditing(true);
    });
  };

  const render = () => {
    stopEditing(false);
    grid.textContent = '';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    headRow.appendChild(document.createElement('th'));
    for (let colIndex = 0; colIndex < columnCount(); colIndex++) {
      const th = document.createElement('th');
      const label = document.createElement('span');
      label.textContent = columnName(colIndex);
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'mini-button';
      deleteButton.textContent = '×';
      deleteButton.title = 'この列を削除';
      deleteButton.tabIndex = -1;
      deleteButton.addEventListener('click', () => {
        for (const row of rows) {
          row.splice(colIndex, 1);
        }
        render();
      });
      th.append(label, deleteButton);
      headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    grid.appendChild(thead);

    const tbody = document.createElement('tbody');
    rows.forEach((row, rowIndex) => {
      const tr = document.createElement('tr');

      const rowHeader = document.createElement('th');
      const label = document.createElement('span');
      label.textContent = String(rowIndex + 1);
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'mini-button';
      deleteButton.textContent = '×';
      deleteButton.title = 'この行を削除';
      deleteButton.tabIndex = -1;
      deleteButton.addEventListener('click', () => {
        rows.splice(rowIndex, 1);
        render();
      });
      rowHeader.append(label, deleteButton);
      tr.appendChild(rowHeader);

      row.forEach((value, colIndex) => {
        const td = document.createElement('td');
        td.textContent = value;
        td.tabIndex = 0;
        td.dataset.row = String(rowIndex);
        td.dataset.col = String(colIndex);
        td.addEventListener('click', () => {
          if (!editing || editing.cell !== td) {
            startEditing(td, rowIndex, colIndex);
          }
        });
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
    grid.appendChild(tbody);

    // 表があるときはドロップエリアがそのまま表の枠になり、
    // 左上は文字コード選択からアイコンボタン群に切り替わる。
    const hasRows = rows.length > 0;
    editor.hidden = !hasRows;
    dropPrompt.hidden = hasRows;
    openControls.hidden = hasRows;
    editorToolbar.hidden = !hasRows;
    dropArea.classList.toggle('is-editor', hasRows);
  };

  // フォーカス中のセルを「現在のセル」として記録する。
  grid.addEventListener('focusin', (event) => {
    const cell = event.target.closest('td');
    if (cell) {
      currentCell = {
        row: Number(cell.dataset.row),
        col: Number(cell.dataset.col),
      };
    }
  });

  // セルにフォーカスがあるときのキー操作（矢印キーで移動など）。
  grid.addEventListener('keydown', (event) => {
    if (editing) {
      return;
    }
    const cell = event.target.closest('td');
    if (!cell) {
      return;
    }
    const rowIndex = Number(cell.dataset.row);
    const colIndex = Number(cell.dataset.col);

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusCell(rowIndex - 1, colIndex);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusCell(rowIndex + 1, colIndex);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusCell(rowIndex, colIndex - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusCell(rowIndex, colIndex + 1);
    } else if (event.key === 'Enter' || event.key === 'F2') {
      event.preventDefault();
      startEditing(cell, rowIndex, colIndex);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      rows[rowIndex][colIndex] = '';
      cell.textContent = '';
    }
  });

  const openFile = async (file) => {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const encoding =
        openEncoding.value === 'auto'
          ? CsvCore.detectEncoding(bytes)
          : openEncoding.value;
      let text;
      try {
        text = CsvCore.decodeBytes(bytes, encoding);
      } catch {
        throw new Error(
          `ファイルを${ENCODING_LABELS[encoding]}として読み込めませんでした。`
        );
      }

      // 区切り文字は自動判定のみ（UI簡素化のため）。
      const delimiterKey = CsvCore.detectDelimiter(text);
      currentDelimiter = CsvCore.DELIMITERS[delimiterKey];
      rows = CsvCore.parseCsv(text, currentDelimiter);

      if (encoding === 'shift_jis' || encoding === 'utf-8') {
        saveEncoding.value = encoding;
      }
      saveFilename.value = file.name;
      render();
      setStatusMessage(
        `${file.name} を読み込みました（${ENCODING_LABELS[encoding]}、${rows.length}行 × ${columnCount()}列）。`,
        true
      );
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const updateBomState = () => {
    saveBom.disabled = saveEncoding.value === 'shift_jis';
  };

  const openSaveModal = () => {
    stopEditing(true);
    saveError.textContent = '';
    updateBomState();
    saveModal.hidden = false;
    saveFilename.focus();
    saveFilename.select();
  };

  const closeSaveModal = () => {
    saveModal.hidden = true;
  };

  const download = () => {
    try {
      const newline = saveNewline.value === 'crlf' ? '\r\n' : '\n';
      const text = CsvCore.serializeCsv(rows, currentDelimiter, newline);
      const bytes = CsvCore.encodeText(
        text,
        saveEncoding.value,
        saveBom.checked
      );
      const blob = new Blob([bytes], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = saveFilename.value || '無題.csv';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatusMessage('ダウンロードしました。', true);
      return true;
    } catch (error) {
      // モーダルを開いたまま、理由をモーダル内に表示する。
      saveError.textContent = error.message;
      setStatusMessage(error.message);
      return false;
    }
  };

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

  // ドロップエリア（表になる前）のクリックでファイル選択を開く。
  dropPrompt.addEventListener('click', () => {
    sourceFile.click();
  });

  newButton.addEventListener('click', (event) => {
    event.stopPropagation();
    currentDelimiter = ',';
    rows = [
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ];
    saveEncoding.value = 'utf-8';
    saveFilename.value = '無題.csv';
    render();
    setStatusMessage('空の表を作成しました。', true);
  });

  addRowButton.addEventListener('click', () => {
    stopEditing(true);
    const newRow = new Array(columnCount()).fill('');
    if (currentCell) {
      rows.splice(currentCell.row + 1, 0, newRow);
      render();
      focusCell(currentCell.row + 1, currentCell.col);
    } else {
      rows.push(newRow);
      render();
    }
  });

  addColButton.addEventListener('click', () => {
    stopEditing(true);
    if (currentCell) {
      for (const row of rows) {
        row.splice(currentCell.col + 1, 0, '');
      }
      render();
      focusCell(currentCell.row, currentCell.col + 1);
    } else {
      for (const row of rows) {
        row.push('');
      }
      render();
    }
  });

  downloadButton.addEventListener('click', openSaveModal);
  openButton.addEventListener('click', () => {
    sourceFile.click();
  });

  saveEncoding.addEventListener('change', updateBomState);
  saveCancelButton.addEventListener('click', closeSaveModal);
  saveConfirmButton.addEventListener('click', () => {
    if (download()) {
      closeSaveModal();
    }
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
});
