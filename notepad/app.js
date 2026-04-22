const STORAGE_KEY = 'storage_key';

function load() {
  return localStorage.getItem(STORAGE_KEY) ?? '';
}

function save(txt) {
  localStorage.setItem(STORAGE_KEY, txt);
}

function downloadText(txt) {
  const blob = new Blob([txt], { type: 'text/plain' });
  const anchor = document.createElement('a');

  anchor.href = URL.createObjectURL(blob);
  anchor.download = 'note.txt';
  anchor.click();
}

function insertText(editor, text) {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;

  editor.setRangeText(text, start, end, 'end');
  save(editor.value);
}

function init() {
  const editor = document.getElementById('editor');

  if (!editor) {
    return;
  }

  editor.value = load();

  editor.addEventListener('input', function () {
    save(editor.value);
  });

  editor.addEventListener('keydown', function (event) {
    if (event.key === 'Tab') {
      event.preventDefault();
      insertText(editor, '\t');
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      downloadText(editor.value);
    }
  });

  editor.focus();
  editor.setSelectionRange(0, 0);
}

init();
