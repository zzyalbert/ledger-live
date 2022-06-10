import React, { useCallback, useRef, useState } from "react";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { launchImageLibrary } from "react-native-image-picker";
import { Alert, Image } from "react-native";
import { CropView } from "react-native-image-crop-tools";
import { readAsStringAsync, EncodingType } from "expo-file-system";

type Props = {
  onResult: (res: { width: number; height: number; imageURI: string }) => void;
};

type Res = {
  base64: string;
  uri?: string;
  width?: number;
  height?: number;
  type?: string;
  filename?: string;
};

const GalleryPicker: React.FC<Props> = props => {
  const [res, setRes] = useState<Res | null>(null);
  const { onResult } = props;

  const handlePressGallery = useCallback(async () => {
    const {
      assets,
      didCancel,
      errorCode,
      errorMessage,
    } = await launchImageLibrary({
      mediaType: "photo",
      quality: 1,
      includeBase64: true,
    });
    if (didCancel) {
      Alert.alert("did cancel");
    } else if (errorCode) {
      console.log("error", errorCode, errorMessage);
    } else {
      const asset = assets && assets[0];
      if (!asset) {
        console.log("asset undefined");
        return;
      }
      const { base64, uri, width, height, type, fileName, mediaType } = asset;
      const fullBase64 = `data:${type};base64, ${base64}`;
      setRes({ base64: fullBase64, uri, width, height, fileName, type });
      onResult({ width, height, imageURI: uri });
    }
  }, [setRes, onResult]);

  return (
    <Flex flexDirection="row" alignItems="center">
      <Button flex={1} onPress={handlePressGallery} type="main">
        Pick from gallery
      </Button>
      {res?.uri ? (
        <Image
          source={{ uri: res?.uri }}
          style={{
            marginLeft: 10,
            height: 30,
            width: 30,
          }}
          resizeMode="contain"
        />
      ) : null}
    </Flex>
  );
};

export default GalleryPicker;

// function GalleryPickerProto() {
//   const [galleryRes, setGalleryRes] = useState(null);
//   const [croppedBase64, setCroppedBase64] = useState<string | null>(null);
//   const cropViewRef = useRef<CropView>(null);
//   const handlePressGallery = useCallback(async () => {
//     const {
//       assets,
//       didCancel,
//       errorCode,
//       errorMessage,
//     } = await launchImageLibrary({
//       mediaType: "photo",
//       quality: 1,
//       includeBase64: true,
//     });
//     if (didCancel) {
//       Alert.alert("did cancel");
//     } else if (errorCode) {
//       console.log("error", errorCode, errorMessage);
//     } else {
//       const asset = assets && assets[0];
//       if (!asset) {
//         console.log("asset undefined");
//         return;
//       }
//       const { base64, uri, width, height, type, fileName, mediaType } = asset;
//       delete asset.base64;
//       const fullBase64 = `data:${type};base64, ${base64}`;
//       console.log("from gallery base64:", fullBase64.slice(0, 100));
//       setGalleryRes({
//         base64: fullBase64,
//         uri,
//         width,
//         height,
//         fileName,
//         mediaType,
//       });
//     }
//   }, []);

//   const handleSave = useCallback(() => {
//     cropViewRef?.current?.saveImage(undefined, 100);
//   }, []);

//   const handleImageCrop = useCallback(async res => {
//     const { height, width, uri: fileUri } = res;
//     console.log("cropped res", res);
//     try {
//       const base64 = await readAsStringAsync(fileUri, {
//         encoding: EncodingType.Base64,
//       });
//       const type = "image/jpg";
//       const fullBase64 = `data:${type};base64, ${base64}`;
//       console.log("cropped base64", fullBase64.slice(0, 100));
//       setCroppedBase64(fullBase64);
//     } catch (e) {
//       console.error(e);
//     }
//   }, []);

//   return (
//     <Flex>
//       <Flex flexDirection="row">
//         <Button onPress={handlePressGallery} type="main">
//           gallery
//         </Button>
//         <Button type="main">camera</Button>
//         {galleryRes?.base64 ? (
//           <Image
//             source={{ uri: galleryRes?.uri }}
//             style={{
//               height: 100,
//               width: 100,
//             }}
//             resizeMode="contain"
//           />
//         ) : null}
//       </Flex>
//       {galleryRes ? (
//         <>
//           <CropView
//             sourceUrl={galleryRes?.uri}
//             style={{ width: "100%", height: 400 }}
//             ref={cropViewRef}
//             onImageCrop={handleImageCrop}
//             keepAspectRatio
//             aspectRatio={{ width: 16, height: 9 }}
//           />
//         </>
//       ) : null}
//       {croppedBase64 ? (
//         <>
//           <Text>croppedBase64: {croppedBase64.slice(0, 40)}</Text>
//           <Image
//             style={{ height: 200, width: 200 }}
//             resizeMode="contain"
//             source={{ uri: croppedBase64 }}
//           />
//         </>
//       ) : null}
//     </Flex>
//   );
// }
