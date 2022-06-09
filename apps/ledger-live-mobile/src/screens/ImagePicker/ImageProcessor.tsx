import React, { Ref } from "react";
import { WebView } from "react-native-webview";
import { injectedCode } from "./injectedCode";
import { InjectedCodeDebugger } from "./InjectedCodeDebugger";

type Props = {
  srcImageBase64: string;
  onBase64PreviewResult: (base64Preview: string) => void;
  onRawHexResult: (rawHexResult: string) => void;
};

/**
 * using a class component here because we need to access some methods from
 * the parent using a ref
 *  */
export default class ImageProcessor extends React.Component<Props> {
  webViewRef: Ref<WebView> = null;

  handleMessage = ({ nativeEvent: { data } }) => {
    const { onBase64PreviewResult, onRawHexResult } = this.props;
    const { type, payload } = JSON.parse(data);
    switch (type) {
      case "LOG":
        console.log("WEBVIEWLOG:", payload);
        break;
      case "BASE64_RESULT":
        onBase64PreviewResult(payload);
        break;
      case "RAW_RESULT":
        onRawHexResult(payload);
        break;
      default:
        break;
    }
  };

  handleWebviewLoaded = ({ nativeEvent: { data } }) => {
    const { srcImageBase64 } = this.props;
    this.webViewRef?.injectJavaScript(`
      window.processImage("${srcImageBase64}");
    `);
  };

  requestRawResult = () => {
    this.webViewRef?.injectJavaScript("window.requestRawResult();");
  };

  render() {
    return (
      <>
        <InjectedCodeDebugger injectedCode={injectedCode} />
        <WebView
          androidLayerType="software"
          ref={c => (this.webViewRef = c)}
          key={injectedCode} // trigger remount (so reload) of webview when source changes in hot reload
          injectedJavaScript={injectedCode}
          androidHardwareAccelerationDisabled={true}
          style={{ height: 0 }}
          onLoadEnd={this.handleWebviewLoaded}
          onMessage={this.handleMessage}
        />
      </>
    );
  }
}
