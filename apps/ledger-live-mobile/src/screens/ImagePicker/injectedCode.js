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

  const postDataToWebView = data => {
    window.ReactNativeWebView.postMessage(JSON.stringify(data));
  };

  /** helper to log stuff in RN JS thread */
  const log = data => {
    postDataToWebView({ type: "LOG", payload: data });
  };

  const grayData = null;

  /**
   * store functions as a property of window so we can access them easily after minification
   * */
  window.processImage = imgBase64 => {
    const image = new Image();

    /**
     * This is a hexadecimal representation of the final image.
     * It has 1 char per pixel, each character being an hexadecimal value
     * between 0 and F (0 and 15).
     * This solution is chosen as it's the most compact & straightforward way to
     * stringify the data of the image.
     * TODO: let's maybe look at a way to losslessly compress this string for
     * even better perf... not sure it's necessary though
     * */
    let rawResult = "";

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);

        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );

        const x = 0;
        const y = 0;

        const imageDataGrayScale = [];
        rawResult = "";

        for (let i = 0; i < imageData.data.length; i += 4) {
          const gray =
            0.299 * imageData.data[i] +
            0.587 * imageData.data[i + 1] +
            0.114 * imageData.data[i + 2];
          // grayscale

          const gray16levels = Math.floor(gray / 16) * 16;
          // color reduction to 16 levels of gray

          rawResult = rawResult.concat((gray16levels / 16).toString(16));
          // adding hexadecimal value of this pixel

          imageDataGrayScale.push(gray16levels);
          imageDataGrayScale.push(gray16levels);
          imageDataGrayScale.push(gray16levels);
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
        postDataToWebView({
          type: "BASE64_RESULT",
          payload: grayScaleBase64,
        });
      } catch (e) {
        log(e.toString());
      }
    };

    image.src = imgBase64;

    window.requestRawResult = () => {
      /**
       * stringifying and then parsing rawResult is a heavy operation that
       * takes a lot of time so we should think of a strategy to request it
       * just once from the outside (for instance when the user is satisfied
       * with the preview)
       */
      postDataToWebView({
        type: "RAW_RESULT",
        payload: rawResult,
      });
    };
  };
}

function getFunctionBody(string) {
  return string.substring(string.indexOf("{") + 1, string.lastIndexOf("}"));
}

export const injectedCode = getFunctionBody(codeToInject.toString());
