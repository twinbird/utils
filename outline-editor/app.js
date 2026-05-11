const STORAGE_KEY = 'outline-editor.items';

const defaultItems = [
  {
    id: crypto.randomUUID(),
    text: '',
    children: [],
    collapsed: false,
  },
];

let items = loadItems();
let activeId = items[0]?.id ?? null;
let pendingOffset = null;
let isComposing = false;

function loadItems() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return structuredClone(defaultItems);
  }

  try {
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Fall back to a fresh outline if storage has invalid JSON.
  }

  return structuredClone(defaultItems);
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function createItem(text = '') {
  return {
    id: crypto.randomUUID(),
    text,
    collapsed: false,
    children: [],
  };
}

function getPlainText(element) {
  return element.innerText.replace(/\n/g, '');
}

function flatten(nodes = items, depth = 0, parent = null, result = []) {
  nodes.forEach((item, index) => {
    result.push({ item, parent, siblings: nodes, index, depth });
    if (!item.collapsed) {
      flatten(item.children, depth + 1, item, result);
    }
  });
  return result;
}

function getEntry(id) {
  return flatten().find((entry) => entry.item.id === id) ?? null;
}

function getActiveIndex(flatItems = flatten()) {
  return flatItems.findIndex((entry) => entry.item.id === activeId);
}

function render() {
  const outline = document.getElementById('outline');

  if (!outline) {
    return;
  }

  outline.innerHTML = '';
  outline.appendChild(renderList(items));

  const focusId = activeId ?? flatten()[0]?.item.id;

  if (focusId) {
    focusBullet(focusId, pendingOffset);
    pendingOffset = null;
  }
}

function renderList(nodes) {
  const list = document.createElement('ul');
  list.className = 'outline-list';

  nodes.forEach((item) => {
    const listItem = document.createElement('li');
    listItem.className = 'outline-item';
    listItem.dataset.id = item.id;

    const row = document.createElement('div');
    row.className = 'bullet-row';

    const dot = document.createElement('button');
    dot.className = 'bullet-dot';
    dot.type = 'button';
    dot.dataset.id = item.id;
    dot.title = '子ブレットを折りたたむ/開く';
    dot.setAttribute('aria-label', '子ブレットを折りたたむ/開く');

    if (item.children.length > 0) {
      dot.classList.add('has-children');
      dot.setAttribute('aria-expanded', String(!item.collapsed));
    } else {
      dot.tabIndex = -1;
      dot.setAttribute('aria-hidden', 'true');
    }

    if (item.collapsed) {
      dot.classList.add('is-collapsed');
    }

    const content = document.createElement('div');
    content.className = 'bullet-content';
    content.contentEditable = 'true';
    content.spellcheck = false;
    content.dataset.id = item.id;
    content.setAttribute('placeholder', '空のブレット');
    content.textContent = item.text;
    content.setAttribute('role', 'textbox');
    content.setAttribute('aria-label', 'ブレット');

    row.append(dot, content);
    listItem.appendChild(row);

    if (item.children.length > 0 && !item.collapsed) {
      listItem.appendChild(renderList(item.children));
    }

    list.appendChild(listItem);
  });

  return list;
}

function focusBullet(id, offset = null) {
  const content = document.querySelector(`.bullet-content[data-id="${id}"]`);

  if (!(content instanceof HTMLElement)) {
    return;
  }

  content.focus();
  setCaretOffset(content, offset ?? getPlainText(content).length);
}

function setCaretOffset(element, offset) {
  const selection = window.getSelection();
  const range = document.createRange();
  const textNode = element.firstChild;
  const safeOffset = Math.max(
    0,
    Math.min(offset, getPlainText(element).length)
  );

  if (!selection) {
    return;
  }

  if (textNode instanceof Text) {
    range.setStart(
      textNode,
      Math.min(safeOffset, textNode.textContent?.length ?? 0)
    );
  } else {
    range.setStart(element, 0);
  }

  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function getCaretOffset(element) {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return getPlainText(element).length;
  }

  const range = selection.getRangeAt(0);
  const before = range.cloneRange();
  before.selectNodeContents(element);
  before.setEnd(range.endContainer, range.endOffset);

  return before.toString().length;
}

function updateItemText(element) {
  const entry = getEntry(element.dataset.id);

  if (!entry) {
    return;
  }

  entry.item.text = getPlainText(element);
  saveItems();
}

function splitTextAtCaret(element) {
  const entry = getEntry(activeId);

  if (!entry) {
    return;
  }

  const text = getPlainText(element);
  const offset = getCaretOffset(element);
  entry.item.text = text.slice(0, offset);
  const newItem = createItem(text.slice(offset));
  entry.siblings.splice(entry.index + 1, 0, newItem);
  activeId = newItem.id;
  pendingOffset = 0;
  saveItems();
  render();
}

function indentCurrent() {
  const entry = getEntry(activeId);

  if (!entry || entry.index === 0) {
    return;
  }

  const previous = entry.siblings[entry.index - 1];
  const [item] = entry.siblings.splice(entry.index, 1);
  previous.children.push(item);
  pendingOffset = item.text.length;
  saveItems();
  render();
}

function outdentCurrent() {
  const entry = getEntry(activeId);

  if (!entry?.parent) {
    return;
  }

  const parentEntry = getEntry(entry.parent.id);

  if (!parentEntry) {
    return;
  }

  const [item] = entry.siblings.splice(entry.index, 1);
  parentEntry.siblings.splice(parentEntry.index + 1, 0, item);
  pendingOffset = item.text.length;
  saveItems();
  render();
}

function moveFocus(delta, offset = null) {
  const flatItems = flatten();
  const index = getActiveIndex(flatItems);
  const next = flatItems[index + delta];

  if (!next) {
    return;
  }

  activeId = next.item.id;
  focusBullet(activeId, offset);
}

function moveItem(delta) {
  const flatItems = flatten();
  const index = getActiveIndex(flatItems);
  const entry = flatItems[index];
  const target = flatItems[index + delta];

  if (!entry || !target || entry.siblings !== target.siblings) {
    return;
  }

  const [item] = entry.siblings.splice(entry.index, 1);
  entry.siblings.splice(target.index, 0, item);
  pendingOffset = item.text.length;
  saveItems();
  render();
}

function removeCurrentOrMerge(element) {
  const entry = getEntry(activeId);
  const text = getPlainText(element);

  if (!entry || text.length > 0 || entry.item.children.length > 0) {
    return false;
  }

  const flatItems = flatten();
  const index = getActiveIndex(flatItems);
  const previous = flatItems[index - 1];

  if (!previous && flatten().length === 1) {
    return false;
  }

  entry.siblings.splice(entry.index, 1);
  activeId = previous?.item.id ?? flatten()[0]?.item.id ?? null;
  pendingOffset = previous ? previous.item.text.length : 0;
  saveItems();
  render();

  return true;
}

function toggleCollapsed(id = activeId) {
  const entry = getEntry(id);

  if (!entry || entry.item.children.length === 0) {
    return;
  }

  entry.item.collapsed = !entry.item.collapsed;
  activeId = entry.item.id;
  pendingOffset = entry.item.text.length;
  saveItems();
  render();
}

function isShortcut(event, key, code = '') {
  return event.key.toLowerCase() === key || event.code === code;
}

function isHelpShortcut(event) {
  return (
    event.key === '?' ||
    event.key === '/' ||
    event.code === 'Slash' ||
    event.code === 'IntlRo'
  );
}

function toggleHelp() {
  const shell = document.querySelector('.app-shell');
  const panel = document.getElementById('help-panel');

  if (!shell || !panel) {
    return;
  }

  const isHidden = panel.hidden;
  panel.hidden = !isHidden;
  shell.classList.toggle('help-hidden', !isHidden);
}

function handleKeydown(event) {
  const target = event.target;

  if (
    !(target instanceof HTMLElement) ||
    !target.classList.contains('bullet-content')
  ) {
    return;
  }

  activeId = target.dataset.id;

  if (event.key === 'Tab') {
    event.preventDefault();
    updateItemText(target);

    if (event.shiftKey) {
      outdentCurrent();
    } else {
      indentCurrent();
    }

    return;
  }

  if (
    event.key === 'Enter' &&
    (isComposing || event.isComposing || event.keyCode === 229)
  ) {
    return;
  }

  if (event.key === 'Enter') {
    event.preventDefault();
    splitTextAtCaret(target);
    return;
  }

  if (event.key === 'Backspace' && getCaretOffset(target) === 0) {
    if (removeCurrentOrMerge(target)) {
      event.preventDefault();
    }

    return;
  }

  if (!event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  const key = event.key.toLowerCase();

  if (isShortcut(event, 'a', 'KeyA')) {
    event.preventDefault();
    setCaretOffset(target, 0);
    return;
  }

  if (isShortcut(event, 'e', 'KeyE')) {
    event.preventDefault();
    setCaretOffset(target, getPlainText(target).length);
    return;
  }

  if (
    isShortcut(event, 'n', 'KeyN') ||
    (event.shiftKey && key === 'arrowdown')
  ) {
    event.preventDefault();
    updateItemText(target);

    if (event.shiftKey) {
      moveItem(1);
    } else {
      moveFocus(1, getCaretOffset(target));
    }

    return;
  }

  if (isShortcut(event, 'p', 'KeyP') || (event.shiftKey && key === 'arrowup')) {
    event.preventDefault();
    updateItemText(target);

    if (event.shiftKey) {
      moveItem(-1);
    } else {
      moveFocus(-1, getCaretOffset(target));
    }

    return;
  }

  if (event.key === '.' || event.code === 'Period') {
    event.preventDefault();
    updateItemText(target);
    toggleCollapsed();
    return;
  }

  if (isHelpShortcut(event)) {
    event.preventDefault();
    toggleHelp();
  }
}

function handlePaste(event) {
  const target = event.target;

  if (
    !(target instanceof HTMLElement) ||
    !target.classList.contains('bullet-content')
  ) {
    return;
  }

  event.preventDefault();
  const text = event.clipboardData?.getData('text/plain') ?? '';
  document.execCommand('insertText', false, text.replace(/\n/g, ' '));
  updateItemText(target);
}

function init() {
  const outline = document.getElementById('outline');

  if (!outline) {
    return;
  }

  outline.addEventListener('input', function (event) {
    if (event.target instanceof HTMLElement) {
      updateItemText(event.target);
    }
  });

  outline.addEventListener('focusin', function (event) {
    if (event.target instanceof HTMLElement && event.target.dataset.id) {
      activeId = event.target.dataset.id;
    }
  });

  outline.addEventListener('keydown', handleKeydown);
  outline.addEventListener('paste', handlePaste);
  outline.addEventListener('click', function (event) {
    if (
      event.target instanceof HTMLButtonElement &&
      event.target.classList.contains('bullet-dot')
    ) {
      toggleCollapsed(event.target.dataset.id);
    }
  });
  outline.addEventListener('compositionstart', function () {
    isComposing = true;
  });
  outline.addEventListener('compositionend', function () {
    isComposing = false;
  });

  render();
}

init();
