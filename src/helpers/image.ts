/**
 * A photo, as a CV stores it: a square JPEG data URL no larger than `edge` pixels. A phone
 * photo is several MB; this keeps the document (which autosaves on every pause) around 50KB.
 */
export const fileToPhotoDataUrl = async (file: Blob, edge = 480, quality = 0.86): Promise<string> => {
  const bitmap = await createImageBitmap(file)
  try {
    const side = Math.min(bitmap.width, bitmap.height)
    const size = Math.min(edge, side)
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas 2D context unavailable')
    // Centre crop, for a file that skipped the cropper.
    context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size)
    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    bitmap.close()
  }
}

/** Hands a downloaded blob to the browser as a file. */
export const saveBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Some browsers start the download asynchronously; revoking at once can cancel it.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
