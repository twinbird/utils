document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('file-input');
  const dropArea = document.getElementById('drop-area');
  const qualityInput = document.getElementById('quality-input');
  const qualityValue = document.getElementById('quality-value');
  const convertButton = document.getElementById('convert-button');
  const statusMessage = document.getElementById('status-message');
  const fileList = document.getElementById('file-list');
  let selectedFiles = [];

  const setStatus = (message, isSuccess = false) => {
    statusMessage.textContent = message;
    statusMessage.classList.toggle('is-success', isSuccess);
  };

  const isHeicFile = (file) => /\.(heic|heif)$/i.test(file.name);

  const formatSize = (size) => {
    if (size < 1024 * 1024) {
      return `${Math.max(1, Math.round(size / 1024))} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getJpegName = (name) => name.replace(/\.(heic|heif)$/i, '') + '.jpg';

  const createFileRow = (file) => {
    const item = document.createElement('li');
    item.className = 'file-item';

    const details = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'file-name';
    name.textContent = file.name;
    const detail = document.createElement('div');
    detail.className = 'file-status';
    detail.textContent = `${formatSize(file.size)} · 変換待ち`;
    details.append(name, detail);
    item.append(details);
    fileList.append(item);

    return { item, detail };
  };

  const updateFiles = (files) => {
    const acceptedFiles = Array.from(files).filter(isHeicFile);
    selectedFiles = acceptedFiles;
    fileList.replaceChildren();
    acceptedFiles.forEach(createFileRow);
    convertButton.disabled = acceptedFiles.length === 0;

    if (acceptedFiles.length === 0) {
      setStatus(
        files.length > 0 ? 'HEICまたはHEIF画像を選択してください。' : ''
      );
      return;
    }

    setStatus(`${acceptedFiles.length}個の画像を選択しました。`);
  };

  const convertFiles = async () => {
    if (typeof window.HeicTo !== 'function') {
      setStatus(
        '変換ライブラリを読み込めませんでした。ページを再読み込みしてお試しください。'
      );
      return;
    }

    convertButton.disabled = true;
    fileInput.disabled = true;
    const rows = Array.from(fileList.children).map((item) => ({
      item,
      detail: item.querySelector('.file-status'),
    }));
    let completed = 0;

    try {
      for (let i = 0; i < selectedFiles.length; i += 1) {
        const file = selectedFiles[i];
        const row = rows[i];
        row.detail.textContent = `${formatSize(file.size)} · 変換中…`;
        row.detail.classList.remove('is-error');

        try {
          const jpegBlob = await window.HeicTo({
            blob: file,
            type: 'image/jpeg',
            quality: Number(qualityInput.value) / 100,
          });
          const downloadUrl = URL.createObjectURL(jpegBlob);
          const downloadLink = document.createElement('a');
          downloadLink.className = 'download-link';
          downloadLink.href = downloadUrl;
          downloadLink.download = getJpegName(file.name);
          downloadLink.textContent = 'JPEGを保存';
          row.item.append(downloadLink);
          row.detail.textContent = `${formatSize(file.size)} · 変換完了（${formatSize(jpegBlob.size)}）`;
          completed += 1;
        } catch {
          row.detail.textContent = `${formatSize(file.size)} · 変換できませんでした。画像形式を確認してください。`;
          row.detail.classList.add('is-error');
        }
      }
    } finally {
      fileInput.disabled = false;
      convertButton.disabled = selectedFiles.length === 0;
      setStatus(
        `${completed}/${selectedFiles.length}個の画像をJPEGに変換しました。`,
        completed > 0
      );
    }
  };

  fileInput.addEventListener('change', () => updateFiles(fileInput.files));
  convertButton.addEventListener('click', () => {
    void convertFiles();
  });
  qualityInput.addEventListener('input', () => {
    qualityValue.value = `${qualityInput.value}%`;
  });

  for (const eventName of ['dragenter', 'dragover']) {
    dropArea.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropArea.classList.add('is-dragging');
    });
  }

  for (const eventName of ['dragleave', 'drop']) {
    dropArea.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropArea.classList.remove('is-dragging');
    });
  }

  dropArea.addEventListener('drop', (event) => {
    updateFiles(event.dataTransfer.files);
  });
});
