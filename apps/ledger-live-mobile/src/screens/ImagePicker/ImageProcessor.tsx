import { Switch, Text } from "@ledgerhq/native-ui";
import React, { useCallback, useRef, useState } from "react";
import { ScrollView } from "react-native";
import { WebView } from "react-native-webview";
import { getInjectedCode } from "./injectedCode";

type Props = {
  srcImageBase64: string;
  onResult: ({ resultImageBase64: string, data: any }) => void;
};

export default function ImagePicker({ srcImageBase64, onResult }: Props) {
  const [sourceVisible, setSourceVisible] = useState(false);
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

  const injectedCode = getInjectedCode();

  const toggleShowSource = useCallback(() => {
    setSourceVisible(!sourceVisible);
  }, [setSourceVisible, sourceVisible]);

  return (
    <>
      <Switch
        checked={sourceVisible}
        onChange={toggleShowSource}
        label="show injected code"
      />
      {sourceVisible && (
        <ScrollView horizontal>
          <Text>{injectedCode}</Text>
        </ScrollView>
      )}
      <WebView
        androidLayerType="software"
        ref={webViewRef}
        injectedJavaScript={injectedCode}
        androidHardwareAccelerationDisabled={true}
        style={{ height: 0 }}
        onLoadEnd={handleWebviewLoaded}
        onMessage={handleMessage}
      />
    </>
  );
}
