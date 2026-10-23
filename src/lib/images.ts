export async function prepareImage(file: File, maxDimension: number): Promise<HTMLCanvasElement> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file such as JPG, PNG, or WebP.');
  if (file.size > 25 * 1024 * 1024) throw new Error('This image is larger than 25 MB. Choose a smaller photo.');
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('This image could not be opened. Try taking the photo again.');
  }
  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not prepare this image.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    bitmap.close();
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement, quality = 0.78): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not save the image preview.'));
    }, 'image/jpeg', quality);
  });
}

export async function createThumbnail(file: File): Promise<Blob> {
  const canvas = await prepareImage(file, 480);
  return canvasToBlob(canvas);
}
