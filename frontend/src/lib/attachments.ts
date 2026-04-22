export interface AttachmentDraft {
  filename: string;
  mimeType: string;
  size: number;
  contentBase64: string;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

export async function encodeFilesForUpload(files: File[]): Promise<AttachmentDraft[]> {
  return Promise.all(
    files.map(async (file) => ({
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      contentBase64: arrayBufferToBase64(await file.arrayBuffer()),
    })),
  );
}
