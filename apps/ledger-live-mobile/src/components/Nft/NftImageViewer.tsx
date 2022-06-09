import React, { memo, useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import NftImage from "./NftImage";

type Props = {
  route: {
    params?: RouteParams;
  };
};

type RouteParams = {
  media: string;
  status: string;
};


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

const NftViewer = ({ route }: Props) => {
  const { params } = route;

  const [loaded, setLoaded] = useState(false);
  const [grayScaleBase64, setGrayScaleBase64] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);
    
  useEffect(() => {
    if(loaded || !params?.media || !webViewRef.current) return;

    fetch(params.media)
      .then(response => response.blob())
      .then(data => new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () =>  resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(data);
      }))
      .then(data => {
        console.log("Sending message");
        webViewRef.current?.injectJavaScript(`
          ${processImageCode}

          processImage("${data}");
        `);
        setLoaded(true);
      });

  }, [loaded, webViewRef]);


  

  return (
    <View style={styles.imageContainer}>
      <NftImage
        src={grayScaleBase64 ?? params?.media}
        status={params?.status}
        style={styles.image}
        hackWidth={10000}
        resizeMode="contain"
      />
      <WebView
        androidLayerType="software"
        ref={webViewRef}
        androidHardwareAccelerationDisabled={true}
        style={styles.webview}
        onMessage={e => {
          setGrayScaleBase64(e.nativeEvent.data);
        }} />
    </View>
  );
};

const styles = StyleSheet.create({
  webview: {
    opacity: 0.99,
    overflow: "hidden",
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
  },
  image: {
    position: "absolute",
    height: "100%",
    width: "100%",
    overflow: "hidden",
  },
});

export default memo(NftViewer);
