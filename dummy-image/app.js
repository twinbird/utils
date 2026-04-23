document.addEventListener('DOMContentLoaded', () => {
  const DEFAULT_SIZE = 150;
  const MIN_SIZE = 1;
  const MAX_SIZE = 4096;
  const PREVIEW_MAX_EDGE = 360;
  const FONT_FAMILY = 'Arial, sans-serif';
  const presets = {
    '16x16-favicon': { width: 16, height: 16, text: 'favicon' },
    '32x32-icon': { width: 32, height: 32, text: 'icon' },
    '150x150-square': { width: 150, height: 150, text: '150x150' },
    '320x180-thumbnail': { width: 320, height: 180, text: 'thumbnail' },
    '600x400-banner': { width: 600, height: 400, text: 'banner' },
    '1200x630-ogp': { width: 1200, height: 630, text: 'ogp' },
  };

  const presetSelect = document.getElementById('preset-size');
  const widthInput = document.getElementById('image-width');
  const heightInput = document.getElementById('image-height');
  const displayTextInput = document.getElementById('display-text');
  const backgroundColorInput = document.getElementById('background-color');
  const textColorInput = document.getElementById('text-color');
  const downloadButton = document.getElementById('download-btn');
  const imageMeta = document.getElementById('image-meta');
  const canvas = document.getElementById('preview-canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    downloadButton.disabled = true;
    imageMeta.textContent = 'このブラウザでは画像生成を利用できません。';
    return;
  }

  let isAutoText = true;

  const clampSize = (value) => {
    if (!Number.isFinite(value)) {
      return DEFAULT_SIZE;
    }

    return Math.min(Math.max(value, MIN_SIZE), MAX_SIZE);
  };

  const parseSize = (value) => {
    const parsedValue = Number.parseInt(value, 10);

    if (Number.isNaN(parsedValue)) {
      return DEFAULT_SIZE;
    }

    return clampSize(parsedValue);
  };

  const getDefaultText = (width, height) => `${width}x${height}`;

  const getCurrentSize = () => {
    const width = parseSize(widthInput.value);
    const height = parseSize(heightInput.value);

    return { width, height };
  };

  const syncInputValues = ({ width, height }) => {
    widthInput.value = String(width);
    heightInput.value = String(height);
  };

  const updateAutoText = ({ width, height }) => {
    if (!isAutoText) {
      return;
    }

    displayTextInput.value = getDefaultText(width, height);
  };

  const updatePreviewScale = (width, height) => {
    const longerEdge = Math.max(width, height);
    const scale = Math.min(PREVIEW_MAX_EDGE / longerEdge, 1);

    canvas.style.width = `${Math.round(width * scale)}px`;
    canvas.style.height = `${Math.round(height * scale)}px`;
  };

  const fitFontSize = (lines, width, height) => {
    if (lines.length === 0) {
      return 0;
    }

    let fontSize = Math.max(
      8,
      Math.floor(Math.min(width * 0.24, (height * 0.42) / lines.length))
    );

    while (fontSize > 8) {
      context.font = `700 ${fontSize}px ${FONT_FAMILY}`;
      const maxLineWidth = Math.max(
        ...lines.map((line) => context.measureText(line).width)
      );
      const lineHeight = fontSize * 1.2;
      const totalHeight = lineHeight * lines.length;

      if (maxLineWidth <= width * 0.84 && totalHeight <= height * 0.8) {
        return fontSize;
      }

      fontSize -= 1;
    }

    return fontSize;
  };

  const renderCanvas = ({ normalizeInputs = false } = {}) => {
    const size = getCurrentSize();

    if (normalizeInputs) {
      syncInputValues(size);
    }

    updateAutoText(size);

    const { width, height } = size;
    const displayText = displayTextInput.value;

    canvas.width = width;
    canvas.height = height;

    context.fillStyle = backgroundColorInput.value;
    context.fillRect(0, 0, width, height);

    if (displayText !== '') {
      const lines = displayText.split(/\r?\n/);
      const fontSize = fitFontSize(lines, width, height);
      const lineHeight = fontSize * 1.2;
      const totalHeight = lineHeight * lines.length;
      let y = (height - totalHeight) / 2 + lineHeight / 2;

      context.fillStyle = textColorInput.value;
      context.font = `700 ${fontSize}px ${FONT_FAMILY}`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';

      lines.forEach((line) => {
        context.fillText(line, width / 2, y);
        y += lineHeight;
      });
    }

    imageMeta.textContent = `${width}x${height} px`;
    updatePreviewScale(width, height);
  };

  const applyPreset = () => {
    const selectedPreset = presets[presetSelect.value];

    if (!selectedPreset) {
      renderCanvas({ normalizeInputs: true });
      return;
    }

    syncInputValues(selectedPreset);
    displayTextInput.value = selectedPreset.text;
    isAutoText =
      selectedPreset.text ===
      getDefaultText(selectedPreset.width, selectedPreset.height);
    renderCanvas({ normalizeInputs: true });
  };

  const handleSizeInput = () => {
    presetSelect.value = 'custom';
    renderCanvas();
  };

  const handleTextInput = () => {
    const { width, height } = getCurrentSize();
    isAutoText = displayTextInput.value === getDefaultText(width, height);
    presetSelect.value = 'custom';
    renderCanvas();
  };

  const downloadImage = () => {
    const { width, height } = getCurrentSize();

    canvas.toBlob((blob) => {
      if (!blob) {
        return;
      }

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `dummy-image-${width}x${height}.png`;
      link.click();
      window.setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 0);
    }, 'image/png');
  };

  presetSelect.addEventListener('change', applyPreset);
  widthInput.addEventListener('input', handleSizeInput);
  heightInput.addEventListener('input', handleSizeInput);
  widthInput.addEventListener('blur', () => {
    renderCanvas({ normalizeInputs: true });
  });
  heightInput.addEventListener('blur', () => {
    renderCanvas({ normalizeInputs: true });
  });
  displayTextInput.addEventListener('input', handleTextInput);
  backgroundColorInput.addEventListener('input', renderCanvas);
  textColorInput.addEventListener('input', renderCanvas);
  downloadButton.addEventListener('click', downloadImage);

  renderCanvas({ normalizeInputs: true });
});
