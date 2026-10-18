document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const qualitySlider = document.getElementById('quality-slider');
  const qualityValue = document.getElementById('quality-value');
  const downloadAllBtn = document.getElementById('download-all-btn');
  const clearBtn = document.getElementById('clear-btn');
  const statusMessage = document.getElementById('status-message');
  const fileList = document.getElementById('file-list');

  let fileItems = [];
  let fileIdCounter = 0;

  const formatFileSize = (bytes) => {
    if (!Number.isFinite(bytes) || bytes <= 0) {
      return '0 B';
    }
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    const clampedIndex = Math.min(index, units.length - 1);
    const value = bytes / Math.pow(1024, clampedIndex);
    return `${value.toFixed(clampedIndex === 0 ? 0 : 1)} ${units[clampedIndex]}`;
  };

  const getJpegFilename = (filename) => {
    return filename.replace(/\.(heic|heif)$/i, '') + '.jpg';
  };

  const updateQualityDisplay = () => {
    qualityValue.textContent = qualitySlider.value;
  };

  const getQualityNumber = () => {
    return Number.parseInt(qualitySlider.value, 10) / 100;
  };

  const updateGlobalUI = () => {
    const hasFiles = fileItems.length > 0;
    const hasConvertedFiles = fileItems.some(
      (item) => item.status === 'done' && item.convertedBlob
    );

    clearBtn.disabled = !hasFiles;
    downloadAllBtn.disabled = !hasConvertedFiles;

    const convertingCount = fileItems.filter(
      (item) => item.status === 'converting'
    ).length;
    const doneCount = fileItems.filter((item) => item.status === 'done').length;
    const errorCount = fileItems.filter(
      (item) => item.status === 'error'
    ).length;

    if (!hasFiles) {
      statusMessage.textContent = '';
      statusMessage.className = 'status-message';
      return;
    }

    if (convertingCount > 0) {
      statusMessage.textContent = `${convertingCount} 件のファイルを変換中...`;
      statusMessage.className = 'status-message';
    } else if (doneCount > 0) {
      const errorText = errorCount > 0 ? ` (${errorCount} 件失敗)` : '';
      statusMessage.textContent = `${doneCount} 件のファイルの変換が完了しました。${errorText}`;
      statusMessage.className = 'status-message is-success';
    } else if (errorCount > 0) {
      statusMessage.textContent = `${errorCount} 件のファイルの変換に失敗しました。`;
      statusMessage.className = 'status-message';
    }
  };

  const revokeItemUrls = (item) => {
    if (item.convertedUrl) {
      URL.revokeObjectURL(item.convertedUrl);
      item.convertedUrl = null;
    }
  };

  const convertNative = async (file, quality) => {
    const imageBitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageBitmap, 0, 0);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas conversion failed'));
          }
        },
        'image/jpeg',
        quality
      );
    });
  };

  const convertFileToJpeg = async (file, quality) => {
    if (typeof window.heic2any === 'function') {
      try {
        const result = await window.heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: quality,
        });
        return Array.isArray(result) ? result[0] : result;
      } catch {
        // Fallback to native conversion if heic2any fails
        return await convertNative(file, quality);
      }
    }

    return await convertNative(file, quality);
  };

  const getImageDimensions = (blobUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
      };
      img.src = blobUrl;
    });
  };

  const processFileItem = async (item) => {
    item.status = 'converting';
    item.errorMessage = '';
    renderFileList();
    updateGlobalUI();

    try {
      const quality = getQualityNumber();
      const jpegBlob = await convertFileToJpeg(item.file, quality);

      revokeItemUrls(item);
      item.convertedBlob = jpegBlob;
      item.convertedSize = jpegBlob.size;
      item.convertedUrl = URL.createObjectURL(jpegBlob);

      const dimensions = await getImageDimensions(item.convertedUrl);
      item.dimensions = dimensions;
      item.status = 'done';
    } catch (err) {
      item.status = 'error';
      item.errorMessage =
        err && err.message ? err.message : 'HEICの変換に失敗しました。';
    }

    renderFileList();
    updateGlobalUI();
  };

  const renderFileList = () => {
    fileList.innerHTML = '';

    fileItems.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'file-card';

      const previewBox = document.createElement('div');
      previewBox.className = 'preview-container';

      if (item.status === 'converting') {
        const spinner = document.createElement('div');
        spinner.className = 'preview-spinner';
        spinner.textContent = '変換中...';
        previewBox.appendChild(spinner);
      } else if (item.status === 'done' && item.convertedUrl) {
        const img = document.createElement('img');
        img.className = 'preview-image';
        img.src = item.convertedUrl;
        img.alt = item.file.name;
        previewBox.appendChild(img);
      } else {
        const errText = document.createElement('div');
        errText.className = 'preview-spinner';
        errText.textContent = 'エラー';
        previewBox.appendChild(errText);
      }

      const fileInfo = document.createElement('div');
      fileInfo.className = 'file-info';

      const fileName = document.createElement('div');
      fileName.className = 'file-name';
      fileName.textContent = item.file.name;

      const fileMeta = document.createElement('div');
      fileMeta.className = 'file-meta';

      if (item.status === 'done') {
        const origSizeText = formatFileSize(item.originalSize);
        const convSizeText = formatFileSize(item.convertedSize);
        const dimText =
          item.dimensions.width > 0
            ? `${item.dimensions.width} x ${item.dimensions.height} px`
            : '';

        fileMeta.textContent = `${origSizeText} → ${convSizeText} | ${dimText}`;
      } else if (item.status === 'error') {
        fileMeta.textContent = item.errorMessage || '変換エラー';
      } else {
        fileMeta.textContent = `元のサイズ: ${formatFileSize(item.originalSize)}`;
      }

      const badge = document.createElement('span');
      badge.className = `status-badge ${item.status}`;
      if (item.status === 'converting') {
        badge.textContent = '変換中';
      } else if (item.status === 'done') {
        badge.textContent = '変換完了';
      } else {
        badge.textContent = '失敗';
      }

      fileInfo.appendChild(fileName);
      fileInfo.appendChild(fileMeta);
      fileInfo.appendChild(badge);

      const actions = document.createElement('div');
      actions.className = 'file-actions';

      if (item.status === 'done' && item.convertedUrl) {
        const downloadBtn = document.createElement('button');
        downloadBtn.type = 'button';
        downloadBtn.textContent = 'ダウンロード';
        downloadBtn.addEventListener('click', () => {
          downloadSingleItem(item);
        });
        actions.appendChild(downloadBtn);
      }

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'secondary-btn';
      removeBtn.textContent = '削除';
      removeBtn.addEventListener('click', () => {
        removeItem(item.id);
      });
      actions.appendChild(removeBtn);

      card.appendChild(previewBox);
      card.appendChild(fileInfo);
      card.appendChild(actions);

      fileList.appendChild(card);
    });
  };

  const downloadSingleItem = (item) => {
    if (!item.convertedUrl) {
      return;
    }
    const link = document.createElement('a');
    link.href = item.convertedUrl;
    link.download = getJpegFilename(item.file.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const removeItem = (id) => {
    const index = fileItems.findIndex((item) => item.id === id);
    if (index !== -1) {
      revokeItemUrls(fileItems[index]);
      fileItems.splice(index, 1);
      renderFileList();
      updateGlobalUI();
    }
  };

  const clearAllItems = () => {
    fileItems.forEach(revokeItemUrls);
    fileItems = [];
    renderFileList();
    updateGlobalUI();
  };

  const handleFiles = (files) => {
    const validFiles = Array.from(files).filter((file) => {
      const ext = file.name.split('.').pop().toLowerCase();
      return (
        ext === 'heic' ||
        ext === 'heif' ||
        file.type === 'image/heic' ||
        file.type === 'image/heif'
      );
    });

    if (validFiles.length === 0) {
      statusMessage.textContent =
        'HEIC / HEIF形式のファイルを選択してください。';
      statusMessage.className = 'status-message';
      return;
    }

    validFiles.forEach((file) => {
      fileIdCounter += 1;
      const item = {
        id: fileIdCounter,
        file: file,
        originalSize: file.size,
        status: 'converting',
        convertedBlob: null,
        convertedUrl: null,
        convertedSize: 0,
        dimensions: { width: 0, height: 0 },
        errorMessage: '',
      };
      fileItems.push(item);
      processFileItem(item);
    });
  };

  const reprocessAllFiles = () => {
    fileItems.forEach((item) => {
      processFileItem(item);
    });
  };

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('is-dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('is-dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('is-dragover');
    if (e.dataTransfer && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  });

  dropZone.addEventListener('click', (e) => {
    if (e.target !== fileInput) {
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files) {
      handleFiles(fileInput.files);
      fileInput.value = '';
    }
  });

  qualitySlider.addEventListener('input', () => {
    updateQualityDisplay();
  });

  qualitySlider.addEventListener('change', () => {
    reprocessAllFiles();
  });

  clearBtn.addEventListener('click', clearAllItems);

  downloadAllBtn.addEventListener('click', () => {
    const completedItems = fileItems.filter(
      (item) => item.status === 'done' && item.convertedUrl
    );
    completedItems.forEach((item, idx) => {
      setTimeout(() => {
        downloadSingleItem(item);
      }, idx * 250);
    });
  });

  updateQualityDisplay();
  updateGlobalUI();
});
