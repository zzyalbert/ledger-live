import React, { useCallback, useEffect, useState } from "react";
import { View, Image, ScrollView } from "react-native";
import { useRoute } from "@react-navigation/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import FtsImageProcessor from "./ImageProcessor";
import { fetchImageBase64 } from "./imageUtils";

type RouteParams = {
  imageUrl?: string;
  imageBase64?: string;
};

const PreviewImage = styled(Image).attrs({
  resizeMode: "contain",
})`
  width: 300px;
  height: 300px;
`;

export default function ImagePicker() {
  const [srcImageBase64, setSrcImageBase64] = useState<string | null>(null);
  const [resultImageBase64, setResultImageBase64] = useState<string | null>(
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

  const onImageProcessorResult = useCallback(
    ({ resultImageBase64, data }) => {
      setResultImageBase64(resultImageBase64);
    },
    [setResultImageBase64],
  );

  return (
    <ScrollView>
      {srcImageBase64 && (
        <View>
          <Text>
            Webview loaded with base64 src: {srcImageBase64.slice(0, 50)}
          </Text>
          <PreviewImage source={{ uri: srcImageBase64 }} />
          <FtsImageProcessor
            srcImageBase64={srcImageBase64}
            onResult={onImageProcessorResult}
          />
        </View>
      )}
      {resultImageBase64 && (
        <Flex>
          <Text>result:</Text>
          <PreviewImage source={{ uri: resultImageBase64 }} />
        </Flex>
      )}
    </ScrollView>
  );
}
