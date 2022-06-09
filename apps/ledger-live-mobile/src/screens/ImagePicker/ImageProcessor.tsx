import React, { useCallback, useEffect, useRef } from "react";
import { WebView } from "react-native-webview";

const processImageCode = `
const processImage = (imgBase64) => {
    var image = new Image();

    image.onload = () => {
        var canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
    
        var context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
    
        var imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        var x = 0;
        var y = 0;

        const imageDataGrayScale = [];

        for (let i = 0; i < imageData.data.length; i += 4) {
            let gray = (0.299*imageData.data[i] + 0.587*imageData.data[i + 1] + 0.114*imageData.data[i + 2]);
            // grayscale
            gray = Math.floor(gray / 16) * 16;
            // color reduction
            imageDataGrayScale.push(gray);
            imageDataGrayScale.push(gray);
            imageDataGrayScale.push(gray);
            // push 3 bytes for color (all the same == gray)

            imageDataGrayScale.push(255);
            // push alpha = max = 255
        }
        
        var grayCanvas = document.createElement('canvas');

        grayCanvas.width = image.width;
        grayCanvas.height = image.height;

        const grayData = Uint8ClampedArray.from(imageDataGrayScale);

        var grayContext = grayCanvas.getContext('2d');
        
        grayContext.putImageData(new ImageData(grayData, image.width, image.height), 0, 0);

        const grayScaleBase64 = grayCanvas.toDataURL();
        window.ReactNativeWebView.postMessage(grayScaleBase64);
    };

    image.src = imgBase64;
};`;

type Props = {
  srcImageBase64: string;
  onResult: ({ resultImageBase64: string, data: any }) => void;
};

export default function ImagePicker({ srcImageBase64, onResult }: Props) {
  const webViewRef = useRef<WebView>(null);

  const handleMessage = useCallback(
    ({ nativeEvent: { data } }) => {
      console.log("webview handleMessage called with", data);
      onResult({ resultImageBase64: data });
    },
    [onResult],
  );

  const handleWebviewLoaded = useCallback(() => {
    webViewRef?.current?.injectJavaScript(`
      ${processImageCode}

      processImage("${srcImageBase64}");
    `);
  }, [srcImageBase64, webViewRef]);

  useEffect(() => {});

  return (
    <WebView
      androidLayerType="software"
      ref={webViewRef}
      androidHardwareAccelerationDisabled={true}
      style={{ height: 0 }}
      onLoadEnd={handleWebviewLoaded}
      onMessage={handleMessage}
    />
  );
}
