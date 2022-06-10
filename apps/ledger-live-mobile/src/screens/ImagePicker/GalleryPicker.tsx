import React, { useCallback, useState } from "react";
import { Button, Flex } from "@ledgerhq/native-ui";
import { launchImageLibrary } from "react-native-image-picker";
import { Alert, Image } from "react-native";

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
