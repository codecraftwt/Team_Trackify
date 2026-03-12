import RNFS from 'react-native-fs';

const OFFLINE_PHOTOS_DIR = `${RNFS.DocumentDirectoryPath}/OfflineTrackingPhotos`;

/**
 * Ensures the offline photos directory exists.
 */
export const ensureOfflinePhotosDir = async () => {
  const exists = await RNFS.exists(OFFLINE_PHOTOS_DIR);
  if (!exists) {
    await RNFS.mkdir(OFFLINE_PHOTOS_DIR);
  }
  return OFFLINE_PHOTOS_DIR;
};

/**
 * Copies a photo from the camera/gallery URI to persistent app storage.
 * Returns the new file path that can be stored in the database.
 * @param {string} sourceUri - Original URI (e.g., content:// or file://...)
 * @param {string} [fileName] - Optional custom file name
 * @returns {Promise<string>} The persistent file path for the copied photo
 */
export const copyPhotoToOfflineStorage = async (sourceUri, fileName) => {
  await ensureOfflinePhotosDir();

  const baseName = fileName || `photo_${Date.now()}.jpg`;
  const destPath = `${OFFLINE_PHOTOS_DIR}/${baseName}`;

  let sourcePath = sourceUri;
  if (!sourceUri.startsWith('/') && !sourceUri.startsWith('file://') && !sourceUri.startsWith('content://')) {
    sourcePath = `file://${sourceUri}`;
  }

  try {
    await RNFS.copyFile(sourcePath, destPath);
  } catch (copyErr) {
    // Fallback for content:// URIs (e.g. Android gallery) - read base64 and write
    if (sourceUri.startsWith('content://') || copyErr?.message?.includes('content')) {
      const base64 = await RNFS.readFile(sourcePath, 'base64');
      await RNFS.writeFile(destPath, base64, 'base64');
    } else {
      throw copyErr;
    }
  }

  return destPath;
};

/**
 * Converts a stored path to a URI suitable for React Native Image component.
 * @param {string} path - Stored path (may be absolute or file://)
 * @returns {string} URI for Image source
 */
export const getPhotoUriForDisplay = (path) => {
  if (!path || typeof path !== 'string') return null;
  const p = String(path).trim();
  if (p.startsWith('file://')) return p;
  if (p.startsWith('/')) return `file://${p}`;
  return p;
};

/**
 * Checks if a photo file exists at the given path.
 */
export const photoFileExists = async (path) => {
  if (!path) return false;
  try {
    const p = path.startsWith('file://') ? path.replace('file://', '') : path;
    return await RNFS.exists(p);
  } catch {
    return false;
  }
};
