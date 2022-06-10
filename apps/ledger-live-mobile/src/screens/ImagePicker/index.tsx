import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Image, ScrollView } from "react-native";
import { useRoute } from "@react-navigation/native";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import ImageProcessor from "./ImageProcessor";
import { fetchImageBase64 } from "./imageUtils";

type RouteParams = {
  imageUrl?: string;
  imageBase64?: string;
};

const PreviewImage = styled(Image).attrs({
  resizeMode: "contain",
})`
  width: 200px;
  height: 200px;
`;

export default function ImagePicker() {
  const imageProcessorRef = useRef<ImageProcessor>(null);
  const [srcImageBase64, setSrcImageBase64] = useState<string | null>(null);
  const [resultImageBase64, setResultImageBase64] = useState<string | null>(
    null,
  );
  const [resultImageRawHex, setResultImageRawHex] = useState<string | null>(
    null,
  );

  const { params = {} }: { params?: RouteParams } = useRoute();

  const { imageUrl, imageBase64 } = params;

  useEffect(() => {
    (async function loadSource() {
      if (!srcImageBase64) {
        if (imageBase64) setSrcImageBase64(imageBase64);
        else if (imageUrl) {
          fetchImageBase64(imageUrl).then((data: string) => {
            setSrcImageBase64(data);
          });
        }
      }
    })();
  }, [setSrcImageBase64, srcImageBase64, imageUrl, imageBase64]);

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
        {srcImageBase64 && (
          <Flex>
            <Text>
              Webview loaded with base64 src: {srcImageBase64.slice(0, 50)}
            </Text>
            <PreviewImage source={{ uri: srcImageBase64 }} />
            <ImageProcessor
              ref={imageProcessorRef}
              srcImageBase64={srcImageBase64}
              onBase64PreviewResult={handleBase64PreviewResult}
              onRawHexResult={handleRawHexResult}
              contrast={1}
              brightness={0.5}
            />
          </Flex>
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
