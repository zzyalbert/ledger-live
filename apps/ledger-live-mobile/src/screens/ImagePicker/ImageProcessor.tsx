import { Alert, Switch, Text } from "@ledgerhq/native-ui";
import React, { useCallback, useRef, useState } from "react";
import { ScrollView } from "react-native";
import { WebView } from "react-native-webview";
import { injectedCode } from "./injectedCode";

type Props = {
  srcImageBase64: string;
  onResult: ({ resultImageBase64: string, data: any }) => void;
};

function InjectedCodeDebugger({ injectedCode }: { injectedCode: string }) {
  const [sourceVisible, setSourceVisible] = useState(false);
  const toggleShowSource = useCallback(() => {
    setSourceVisible(!sourceVisible);
  }, [setSourceVisible, sourceVisible]);
  const warningVisible = injectedCode?.trim() === "[bytecode]"; // see https://github.com/facebook/hermes/issues/612
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
      {warningVisible && (
        <Alert
          type="error"
          title="Injected code not properly stringified, please save the injectedCode.js file to trigger a hot reload & it will work fine"
        />
      )}
    </>
  );
}

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
    <>
      <InjectedCodeDebugger injectedCode={injectedCode} />
      <WebView
        androidLayerType="software"
        ref={webViewRef}
        key={injectedCode} // trigger remount (so reload) of webview when source changes in hot reload
        injectedJavaScript={injectedCode}
        androidHardwareAccelerationDisabled={true}
        style={{ height: 0 }}
        onLoadEnd={handleWebviewLoaded}
        onMessage={handleMessage}
      />
    </>
  );
}
