const STORAGE_KEY = 'storage_key';
const CURSOR_POSITION_HEAD = -1;

function load() {
  return localStorage.getItem(STORAGE_KEY);
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

function init() {
  const editor = ace.edit('editor');

  editor.setShowPrintMargin(false);
  editor.setOptions({
    fontSize: '10.5pt',
  });

  editor.session.on('change', function (_delta) {
    const txt = editor.getValue();
    save(txt);
  });

  editor.commands.addCommand({
    name: 'save',
    bindKey: { win: 'Ctrl-S', mac: 'Cmd-S' },
    exec: function (currentEditor) {
      downloadText(currentEditor.session.getValue());
    },
  });

  editor.setValue(load(), CURSOR_POSITION_HEAD);
  editor.focus();
}

init();
