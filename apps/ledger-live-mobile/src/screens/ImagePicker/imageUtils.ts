import { Image } from "react-native";
import {
  cacheDirectory,
  createDownloadResumable,
  documentDirectory,
  EncodingType,
  readAsStringAsync,
  StorageAccessFramework,
  writeAsStringAsync,
} from "expo-file-system";
import { uniqueId } from "lodash";

export async function fetchImageBase64(imageUrl: string) {
  return fetch(imageUrl)
    .then(response => response.blob())
    .then(
      data =>
        new Promise<string | undefined>((resolve, reject) => {
          const reader = new FileReader(); // eslint-disable-line no-undef
          reader.onloadend = () => resolve(reader.result?.toString());
          reader.onerror = reject;
          reader.readAsDataURL(data);
        }),
    );
}

export async function loadImageBase64FromURI(
  fileUri: string,
  mimeType = "image/jpg",
) {
  const base64 = await readAsStringAsync(fileUri, {
    encoding: EncodingType.Base64,
  });
  const fullBase64 = `data:${mimeType};base64, ${base64}`;
  return fullBase64;
}

function getMimeTypeFromBase64(base64: string) {
  return base64.split(";")[0].slice(5);
}

type Options = {
  encoding: EncodingType.UTF8 | EncodingType.Base64;
};

export async function createFileAndWriteContent(
  parentUri: string,
  fileName: string,
  mimeType: string,
  contents: string,
  options: Options,
) {
  const fileUri = `${parentUri}/${fileName}`;
  await StorageAccessFramework.writeAsStringAsync(fileUri, contents, options);
  return fileUri;
}

export async function downloadImageToFile(imageUrl: string) {
  const fileId = uniqueId();
  const base64Image = await fetchImageBase64(imageUrl);
  if (!base64Image) throw new Error("no result from image base64 download");
  if (!cacheDirectory) throw new Error("no cache directory");
  const mimeType = getMimeTypeFromBase64(base64Image || "");
  const fileExtension = mimeType.split("/")[1];
  const fileName = `${fileId}.${fileExtension}`;
  const resultUri = await createFileAndWriteContent(
    cacheDirectory,
    fileName,
    mimeType,
    base64Image?.split(",")[1],
    {
      encoding: EncodingType.Base64,
    },
  );
  return resultUri;
}

export async function loadImageSizeAsync(url: string) {
  return new Promise((resolve, reject) => {
    Image.getSize(
      url,
      (width, height) => {
        resolve({ width, height });
      },
      error => {
        reject(error);
      },
    );
  });
}
