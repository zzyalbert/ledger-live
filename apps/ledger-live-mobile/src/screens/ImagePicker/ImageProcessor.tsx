import React, { Ref } from "react";
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
   *  - 1:  original brightness
   *  - >1: brighter than the original
   * */
  brightness: number;
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
  webViewRef: Ref<WebView> = null;

  componentDidUpdate(prevProps: Props) {
    if (prevProps.contrast !== this.props.contrast) this.setContrast();
    if (prevProps.brightness !== this.props.brightness) this.setBrightness();
  }

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

  injectJavaScript = (script: string) => {
    this.webViewRef?.injectJavaScript(script);
  };

  processImage = () => {
    const { srcImageBase64 } = this.props;
    this.injectJavaScript(`window.processImage("${srcImageBase64}");`);
  };

  setBrightness = () => {
    const { brightness } = this.props;
    this.injectJavaScript(`window.setImageBrightness(${brightness});`);
  };

  setContrast = () => {
    const { contrast } = this.props;
    this.injectJavaScript(`window.setImageContrast(${contrast});`);
  };

  requestRawResult = () => {
    this.injectJavaScript("window.requestRawResult();");
  };

  handleWebviewLoaded = ({ nativeEvent: { data } }) => {
    const { srcImageBase64 } = this.props;
    this.setBrightness();
    this.setContrast();
    this.processImage();
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
