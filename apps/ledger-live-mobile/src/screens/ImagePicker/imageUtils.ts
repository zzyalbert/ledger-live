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
