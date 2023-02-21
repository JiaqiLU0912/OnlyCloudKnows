/**
 * https://stackoverflow.com/a/49821276/18513152
 * https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet/add
 * https://developer.chrome.com/docs/extensions/reference/runtime/#method-getURL
 * https://github.com/web-fonts/dejavu-sans-condensed-bold
 * Another way to add fonts, injecting a style node, would cause an obvious delay.
 */
const pathToFont = chrome.runtime.getURL('fonts/dejavu-sans-condensed-bold-webfont.woff2');
const injectedFont = new FontFace('DejaVu Sans Condensed Bold', "url(" + pathToFont + ")");

const passImageUrlToBackground = async (imageUrl, imageNode) => {
  const message = { action: 'fetchImage', data: imageUrl };
  chrome.runtime.sendMessage(message, (response) => {
    if (typeof response != 'undefined' && response.length > 0) {
      overlayPredictionTextOverImage(response[0], imageNode);
    }
    if (chrome.runtime.lastError) {
      console.warn(chrome.runtime.lastError.message);
    }
  });
}

let observer = new MutationSummary({
  callback: updateImageElement,
  queries: [{ element: 'img' }]
});

function updateImageElement(summaries) {
  let imageSummary = summaries[0];
  imageSummary.added.forEach((imageNode) => {
    imageUrl = imageNode.src;
    passImageUrlToBackground(imageUrl, imageNode);
  });
}

const getImageElementWithSrcUrl = () => {
  const imgElArr = Array.from(document.getElementsByTagName('img'));
  if (imgElArr.length > 0) {
    imgElArr.forEach((imageNode) => {
      imageUrl = imageNode.src;
      passImageUrlToBackground(imageUrl, imageNode);
    });
  }
}

const init = () => {
  document.fonts.add(injectedFont);
  // https://developer.mozilla.org/en-US/docs/Web/API/FontFace
  injectedFont.load().then(() => getImageElementWithSrcUrl(), (err) => { console.error(err) });
}
init();

// https://github.com/dhowe/AdLiPo/blob/4e1e31e1f61210d8692abc0386c2c7083d676b77/src/js/injectTemplate.js#L181
const overlayPredictionTextOverImage = (textContent, image) => {
  const originalParent = image.parentElement; // https://stackoverflow.com/a/8685780/18513152
  const container = document.createElement('div');
  container.style.backgroundColor = 'transparent';
  container.style.border = '0';
  container.style.width = image.offsetWidth + 'px';
  container.style.height = image.offsetHeight + 'px';
  container.style.position = 'relative';
  image.style.position = 'absolute';
  // https://github.com/tensorflow/tfjs-examples/blob/ca7a661228234448284f0b3c723b41bb1ec27dcd/chrome-extension/src/content.js#L115
  originalParent.insertBefore(container, image);
  container.appendChild(image);

  const width = container.style.width;
  const height = container.style.height;
  const font = 'DejaVu Sans Condensed Bold';
  const textAlign = 'left';
  const wordBreak = 'normal';
  const lineHeight = 'normal';
  const horizontalPadding = Math.min(parseInt(Math.max(2, parseInt(width) / 15)), 20);
  const verticalPadding = Math.min(parseInt(Math.max(2, parseInt(height) / 15)), 20);
  const padding = `${verticalPadding}px ${horizontalPadding}px`;
  // https://github.com/dhowe/AdLiPo/blob/4e1e31e1f61210d8692abc0386c2c7083d676b77/src/js/injectTemplate.js#L268
  const fontSize = computeFontSize(textContent, width, height, font, textAlign, wordBreak, lineHeight, padding, 100);

  container.style.color = 'red';
  container.style.fontFamily = font;
  container.style.fontSize = fontSize;
  container.style.fontWeight = 'normal';
  container.style.textAlign = textAlign;
  container.style.wordBreak = wordBreak;
  container.style.lineHeight = lineHeight;
  container.style.display = 'table';

  const text = document.createElement('div');
  text.style.display = 'table-cell';
  text.style.verticalAlign = 'middle';
  text.style.position = 'absolute';
  text.style.padding = padding;
  text.innerText = textContent;
  container.appendChild(text);
  text.before(image);
}
