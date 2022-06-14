declare global {
  interface Window {
    ReactNativeWebView: any;
    processImage: (imgBase64: string) => void;
    setImageBrightness: (val: number) => void;
    setImageContrast: (val: number) => void;
    requestRawResult: () => void;
  }
}


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

  /* eslint-disable no-ufezndef */
  /* eslint-disable no-unused-vars */

  // simutaneously apply grayscale and contrast to the image
  function applyFilter(imageData: Uint8ClampedArray, contrastAmount: number): Uint8ClampedArray {
    rawResult = "";

    const filteredImageData = [];
  
    for (let i = 0; i < imageData.length; i += 4) {
      let gray =
        0.299 * imageData[i] +
        0.587 * imageData[i + 1] +
        0.114 * imageData[i + 2];
      // grayscale

      gray = (gray - 128) * contrastAmount + 128;
      // contrast
  
      const gray16levels = Math.floor(gray / 16) * 16;
      // color reduction to 16 levels of gray
  
      rawResult = rawResult.concat((gray16levels / 16).toString(16));
      // adding hexadecimal value of this pixel
  
      filteredImageData.push(gray16levels);
      filteredImageData.push(gray16levels);
      filteredImageData.push(gray16levels);
      // push 3 bytes for color (all the same == gray)
  
      filteredImageData.push(255);
      // push alpha = max = 255
    }
  
    return Uint8ClampedArray.from(filteredImageData);
  }

  const postDataToWebView = (data: any) => {
    window.ReactNativeWebView.postMessage(JSON.stringify(data));
  };

  /** helper to log stuff in RN JS thread */
  const log = (data: any) => {
    postDataToWebView({ type: "LOG", payload: data });
  };

  let image: any = null;

  /**
   * This is a hexadecimal representation of the final image.
   * It has 1 char per pixel, each character being an hexadecimal value
   * between 0 and F (0 and 15).
   * This solution is chosen as it's the most straightforward way to stringify
   * the data of the image in a "compact" way.
   * */
  let rawResult = "";

  const computeResult = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;

      const context = canvas.getContext("2d");

      if(!context) return;

      context.drawImage(image, 0, 0);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      const grayData = applyFilter(imageData.data, contrast);
      
      const grayCanvas = document.createElement("canvas");
      grayCanvas.width = image.width;
      grayCanvas.height = image.height;
      const grayContext = grayCanvas.getContext("2d");

      if(!grayContext) return;

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
      if(e instanceof Error) {
        log(e.toString());
        console.error(e);
      }
    }
  };

  /**
   * store functions as a property of window so we can access them easily after minification
   * */
  window.processImage = imgBase64 => {
    image = new Image();

    image.onload = () => {
      computeResult();
    };

    image.src = imgBase64;
  };

  let contrast = 1;

  window.setImageContrast = val => {
    contrast = val;
    if (image) computeResult();
  };

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
}

function getFunctionBody(str: string) {
  return str.substring(str.indexOf("{") + 1, str.lastIndexOf("}"));
}

export const injectedCode = getFunctionBody(codeToInject.toString());
