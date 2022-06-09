/* This function is meant to be stringified and its body injected in the webview */
function codeToInject() {
  /* eslint-disable prettier/prettier */
  /**
   * The following line is a hermes directive that allows
   * Function.prototype.toString() to return clear stringified code that can
   * thus be injected.
   * 
   * ⚠️ IN DEBUG this doesn't work until you hot reload this file (just save the file and it will work)
   * see https://github.com/facebook/hermes/issues/612
   *  */ 
  

  "show source"

  /* eslint-enable prettier/prettier */

  /* eslint-disable no-undef */
  /* eslint-disable no-unused-vars */

  // store the function as a property of window so we can access it with its name even after minification
  window.processImage = imgBase64 => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;

      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      const x = 0;
      const y = 0;

      const imageDataGrayScale = [];

      for (let i = 0; i < imageData.data.length; i += 4) {
        let gray =
          0.299 * imageData.data[i] +
          0.587 * imageData.data[i + 1] +
          0.114 * imageData.data[i + 2];
        // grayscale
        gray = Math.floor(gray / 16) * 16; // are we sure about Math.floor here and not Math.round?
        // color reduction
        imageDataGrayScale.push(gray);
        imageDataGrayScale.push(gray);
        imageDataGrayScale.push(gray);
        // push 3 bytes for color (all the same == gray)

        imageDataGrayScale.push(255);
        // push alpha = max = 255
      }

      const grayCanvas = document.createElement("canvas");

      grayCanvas.width = image.width;
      grayCanvas.height = image.height;

      const grayData = Uint8ClampedArray.from(imageDataGrayScale);

      const grayContext = grayCanvas.getContext("2d");

      grayContext.putImageData(
        new ImageData(grayData, image.width, image.height),
        0,
        0,
      );

      const grayScaleBase64 = grayCanvas.toDataURL();
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          grayScaleBase64,
          /**
           * stringifying and then parsing grayData is a heavy operation that
           * takes a lot of time so we should think of a strategy to request it
           * just once from the outside (for instance when the user is satisfied
           * with the preview)
           */
          // grayData,
        }),
      );
    };

    image.src = imgBase64;
  };
}

function getFunctionBody(string) {
  return string.substring(string.indexOf("{") + 1, string.lastIndexOf("}"));
}

export const injectedCode = getFunctionBody(codeToInject.toString());
