/**
 * Compresses an image file to a lightweight JPEG data URL using HTML5 Canvas.
 * Ensures ultra-fast uploads, low memory footprint, and reliable persistence in MongoDB.
 *
 * @param {File} file - The uploaded image file
 * @param {number} maxWidth - Maximum width in pixels (default 900)
 * @param {number} maxHeight - Maximum height in pixels (default 900)
 * @param {number} quality - JPEG compression quality 0-1 (default 0.7)
 * @returns {Promise<string>} - Resolves to data:image/jpeg;base64,... string
 */
export const compressImage = (file, maxWidth = 900, maxHeight = 900, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const isImage =
      !file.type ||
      file.type.startsWith("image/") ||
      /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name || "");

    if (!isImage) {
      reject(new Error("Selected file is not an image."));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Fallback to FileReader if objectUrl encounters any security/cors/format restrictions
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (re) => {
        const fallbackImg = new Image();
        fallbackImg.onerror = reject;
        fallbackImg.onload = () => {
          try {
            resolve(renderToCanvas(fallbackImg, maxWidth, maxHeight, quality));
          } catch (e) {
            // Last resort: if canvas fails, return reader result
            resolve(re.target.result);
          }
        };
        fallbackImg.src = re.target.result;
      };
      reader.readAsDataURL(file);
    };

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const compressed = renderToCanvas(img, maxWidth, maxHeight, quality);
        resolve(compressed);
      } catch (err) {
        reject(err);
      }
    };

    img.src = objectUrl;
  });
};

function renderToCanvas(img, maxWidth, maxHeight, quality) {
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (!width || !height) {
    width = 800;
    height = 600;
  }

  // Calculate proportional dimensions capped at maxWidth x maxHeight
  if (width > maxWidth || height > maxHeight) {
    if (width / height > maxWidth / maxHeight) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    } else {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", quality);
}
