import React from "react";
import { Button, Icons } from "@ledgerhq/native-ui";
import { WebView } from "react-native-webview";
import { injectedCode } from "./injectedCode";
import { InjectedCodeDebugger } from "./InjectedCodeDebugger";

type Props = {
  srcImageBase64: string;
  onBase64PreviewResult: (base64Preview: string) => void;
  onRawHexResult: (rawHexResult: string) => void;
  /**
   * number >= 0
   *  - 0:  full black
   *  - 1:  original contrast
   *  - >1: more contrasted than the original
   * */
  contrast: number;
};

/**
 * using a class component here because we need to access some methods from
 * the parent using a ref
 *  */
export default class ImageProcessor extends React.Component<Props> {
  webViewRef: WebView<{}> | null = null;

  componentDidUpdate(prevProps: Props) {
    if (prevProps.contrast !== this.props.contrast) this.setContrast();
    if (prevProps.srcImageBase64 !== this.props.srcImageBase64)
      this.computeResult();
  }

  handleMessage = ({ nativeEvent: { data } }: any) => {
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

  injectJavaScript = (script: string) => {
    this.webViewRef?.injectJavaScript(script);
  };

  processImage = () => {
    const { srcImageBase64 } = this.props;
    this.injectJavaScript(`window.processImage("${srcImageBase64}");`);
  };

  setContrast = () => {
    const { contrast } = this.props;
    this.injectJavaScript(`window.setImageContrast(${contrast});`);
  };

  requestRawResult = () => {
    this.injectJavaScript("window.requestRawResult();");
  };

  computeResult = () => {
    this.setContrast();
    this.processImage();
  };

  handleWebviewLoaded = () => {
    this.computeResult();
  };

  reloadWebView = () => {
    this.webViewRef?.reload();
  };

  render() {
    return (
      <>
        <InjectedCodeDebugger injectedCode={injectedCode} />
        <Button
          Icon={Icons.RefreshMedium}
          type="main"
          outline
          mt={3}
          onPress={this.reloadWebView}
        >
          Reload WebView
        </Button>
        <WebView
          ref={c => (this.webViewRef = c)}
          injectedJavaScript={injectedCode}
          androidLayerType="software"
          androidHardwareAccelerationDisabled
          style={{ height: 0 }}
          onLoadEnd={this.handleWebviewLoaded}
          onMessage={this.handleMessage}
        />
      </>
    );
  }
}
