import React, { useCallback, useEffect, useRef, useState } from "react";
import { Image, ScrollView, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import ImageProcessor from "./ImageProcessor";
import GalleryPicker from "./GalleryPicker";
import ImageCropper from "./ImageCropper";

type RouteParams = {
  imageUrl?: string;
};

const PreviewImage = styled(Image).attrs({
  resizeMode: "contain",
})`
  width: 200px;
  height: 200px;
`;

type ImageDimensions = {
  height: number;
  width: number;
};

type SrcImage = ImageDimensions & {
  uri: string;
};

type CroppedImage = ImageDimensions & {
  base64URI: string;
};

type ResultImage = ImageDimensions & {
  base64URI: string;
};

function fallbackIsNan(number: number, fallback: number): number {
  return isNaN(number) ? fallback : number;
}

export default function ImagePicker() {
  const imageProcessorRef = useRef<ImageProcessor>(null);
  // const [srcImageBase64, setSrcImageBase64] = useState<string | null>(null);
  const [srcImage, setSrcImage] = useState<SrcImage | null>(null);
  const [croppedImage, setCroppedImage] = useState<CroppedImage | null>(null);
  // const [resultImage, setResultImage] = useState<ResultImage | null>(null);

  const [resultImageBase64, setResultImageBase64] = useState<string | null>(
    null,
  );
  const [resultImageRawHex, setResultImageRawHex] = useState<string | null>(
    null,
  );

  const { params = {} }: { params?: RouteParams } = useRoute();

  const { imageUrl: paramsImageURL } = params;

  /** SOURCE IMAGE HANDLING */

  useEffect(() => {
    if (paramsImageURL) {
      Image.getSize(
        paramsImageURL,
        (width, height) => {
          setSrcImage({ uri: paramsImageURL, width, height });
        },
        error => {
          console.log("error while Image.getSize of original URL");
          console.error(error);
        },
      );
    }
  }, [paramsImageURL]);

  const handleGalleryPickerResult = useCallback(
    ({ width, height, imageURI }) => {
      setSrcImage({ width, height, uri: imageURI });
    },
    [setSrcImage],
  );

  /** CROP IMAGE HANDLING */

  const handleCropResult = useCallback(
    ({ width, height, base64Image }) => {
      setCroppedImage({ width, height, base64URI: base64Image });
    },
    [setCroppedImage],
  );

  /** RESULT IMAGE HANDLING */

  const handleBase64PreviewResult = useCallback(
    data => {
      setResultImageBase64(data);
    },
    [setResultImageBase64],
  );

  const handleRawHexResult = useCallback(
    data => {
      setResultImageRawHex(data);
    },
    [setResultImageRawHex],
  );

  const requestRawResult = useCallback(() => {
    imageProcessorRef?.current?.requestRawResult();
  }, [imageProcessorRef]);

  const [contrast, setContrast] = useState(1);

  return (
    <ScrollView>
      <Flex p={5}>
        {!paramsImageURL && (
          <GalleryPicker onResult={handleGalleryPickerResult} />
        )}
        {srcImage?.uri ? (
          <Flex mt={5}>
            <Text mt={5} variant="h3">
              Source image:
            </Text>
            <PreviewImage
              source={{ uri: srcImage?.uri }}
              style={{
                height: 200,
                width: fallbackIsNan(
                  (srcImage.width / srcImage.height) * 200,
                  200,
                ),
              }}
            />
            <Flex height={5} />
            <Text mt={5} variant="h3">
              Cropping:
            </Text>
            <ImageCropper
              sourceUri={srcImage.uri}
              aspectRatio={{ height: 1920, width: 1080 }}
              style={{ alignSelf: "center", height: 640 / 2, width: 360 / 2 }}
              onResult={handleCropResult}
            />
          </Flex>
        ) : null}
        {croppedImage?.base64URI && (
          <>
            <Text mt={5} variant="h3">
              Image processing:
            </Text>
            <View style={{ flexDirection: "row" }}>
              <Button onPress={() => setContrast(1)} type="color">
                1
              </Button>
              <Button onPress={() => setContrast(2)} type="color">
                2
              </Button>
              <Button onPress={() => setContrast(5)} type="color">
                3
              </Button>
              <Button onPress={() => setContrast(8)} type="color">
                4
              </Button>
            </View>
            <ImageProcessor
              ref={imageProcessorRef}
              srcImageBase64={croppedImage?.base64URI}
              onBase64PreviewResult={handleBase64PreviewResult}
              onRawHexResult={handleRawHexResult}
              contrast={contrast}
            />
          </>
        )}
        {resultImageBase64 && (
          <Flex>
            <Text mt={5} variant="h3">
              result:
            </Text>
            <PreviewImage source={{ uri: resultImageBase64 }} />
            <Button type="main" onPress={requestRawResult}>
              Request & display (shortened) hex data
            </Button>
            {resultImageRawHex && (
              <>
                <Text>Raw result:</Text>
                <Text>{resultImageRawHex.slice(0, 2000)}</Text>
              </>
            )}
          </Flex>
        )}
      </Flex>
    </ScrollView>
  );
}
