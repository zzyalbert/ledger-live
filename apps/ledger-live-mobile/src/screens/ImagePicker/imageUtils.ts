import { EncodingType, readAsStringAsync } from "expo-file-system";

export async function fetchImageBase64(imageUrl: string) {
  return fetch(imageUrl)
    .then(response => response.blob())
    .then(
      data =>
        new Promise((resolve, reject) => {
          const reader = new FileReader(); // eslint-disable-line no-undef
          reader.onloadend = () => resolve(reader.result);
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
