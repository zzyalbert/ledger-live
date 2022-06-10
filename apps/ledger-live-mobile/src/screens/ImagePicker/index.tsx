import React, { useCallback, useEffect, useRef, useState } from "react";
import { Image, ScrollView } from "react-native";
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

function fallbackIsNan(number, fallback) {
  return isNaN(number) ? fallback : number;
}

export default function ImagePicker() {
  const imageProcessorRef = useRef<ImageProcessor>(null);
  // const [srcImageBase64, setSrcImageBase64] = useState<string | null>(null);
  const [srcImage, setSrcImage] = useState<SrcImage | null>(null);
  const [croppedImage, setCroppedImage] = useState<CroppedImage | null>(null);
  const [resultImage, setResultImage] = useState<ResultImage | null>(null);

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
    imageProcessorRef?.current.requestRawResult();
  }, [imageProcessorRef]);

  return (
    <ScrollView>
      <Flex p={5}>
        {!paramsImageURL && (
          <GalleryPicker onResult={handleGalleryPickerResult} />
        )}
        {srcImage?.uri ? (
          <Flex mt={5}>
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
            <ImageCropper
              sourceUri={srcImage.uri}
              aspectRatio={{ height: 1920, width: 1080 }}
              style={{ alignSelf: "center", height: 640 / 2, width: 360 / 2 }}
              onResult={handleCropResult}
            />
          </Flex>
        ) : null}
        {croppedImage?.base64URI && (
          <ImageProcessor
            ref={imageProcessorRef}
            srcImageBase64={croppedImage?.base64URI}
            onBase64PreviewResult={handleBase64PreviewResult}
            onRawHexResult={handleRawHexResult}
            contrast={1}
            brightness={0.5}
          />
        )}
        {resultImageBase64 && (
          <Flex pt={5}>
            <Text variant="h3">result:</Text>
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
