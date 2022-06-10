import React, { useCallback, useRef } from "react";
import { Button, Flex } from "@ledgerhq/native-ui";
import { CropView } from "react-native-image-crop-tools";
import { readAsStringAsync, EncodingType } from "expo-file-system";

type Props = {
  sourceUri: string;
  aspectRatio: { width: number; height: number };
  onResult: (res: {
    width: number;
    height: number;
    base64Image: string;
  }) => void;
  style?: StyleProp<View>;
};

const ImageCropper: React.FC<Props> = props => {
  const { style, sourceUri, aspectRatio, onResult } = props;

  const cropViewRef = useRef<CropView>(null);

  const handleImageCrop = useCallback(
    async res => {
      const { height, width, uri: fileUri } = res;
      // console.log("cropped res", res);
      try {
        const base64 = await readAsStringAsync(fileUri, {
          encoding: EncodingType.Base64,
        });
        const type = "image/jpg";
        const fullBase64 = `data:${type};base64, ${base64}`;
        // console.log("cropped base64", fullBase64.slice(0, 100));
        onResult({ width, height, base64Image: fullBase64 });
      } catch (e) {
        console.error(e);
      }
    },
    [onResult],
  );

  const handleSave = useCallback(() => {
    cropViewRef?.current?.saveImage(undefined, 100);
  }, []);

  return (
    <Flex>
      <CropView
        key={sourceUri}
        sourceUrl={sourceUri}
        style={style}
        ref={cropViewRef}
        onImageCrop={handleImageCrop}
        keepAspectRatio
        aspectRatio={aspectRatio}
      />
      <Button type="main" onPress={handleSave}>
        save
      </Button>
    </Flex>
  );
};

export default ImageCropper;
