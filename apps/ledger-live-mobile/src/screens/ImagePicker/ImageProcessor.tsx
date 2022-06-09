import React, { useCallback, useRef } from "react";
import { WebView } from "react-native-webview";
import { injectedCode } from "./injectedCode";

type Props = {
  srcImageBase64: string;
  onResult: ({ resultImageBase64: string, data: any }) => void;
};

export default function ImagePicker({ srcImageBase64, onResult }: Props) {
  const webViewRef = useRef<WebView>(null);

  const handleMessage = useCallback(
    ({ nativeEvent: { data } }) => {
      const { grayScaleBase64, grayData } = JSON.parse(data);
      onResult({ resultImageBase64: grayScaleBase64, data: grayData });
    },
    [onResult],
  );

  const handleWebviewLoaded = useCallback(() => {
    webViewRef?.current?.injectJavaScript(`
      window.processImage("${srcImageBase64}");
    `);
  }, [srcImageBase64, webViewRef]);

  return (
    <WebView
      androidLayerType="software"
      ref={webViewRef}
      injectedJavaScript={injectedCode}
      androidHardwareAccelerationDisabled={true}
      style={{ height: 0 }}
      onLoadEnd={handleWebviewLoaded}
      onMessage={handleMessage}
    />
  );
}
