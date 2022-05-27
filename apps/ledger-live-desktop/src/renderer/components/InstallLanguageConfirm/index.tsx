import React from "react";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import useTheme from "~/renderer/hooks/useTheme";
import { renderVerifyUnwrapped } from "~/renderer/components/DeviceAction/rendering";
import styled from "styled-components";
import Box from "~/renderer/components/Box";

type Props = {
  device: Device
};

const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  fontSize: 4,
  height: "100%",
  justifyContent: "center",
  pb: 4,
}))``;

const InstallLanguageConfirm = ({ device }: Props) => {
  const type = useTheme("colors.palette.type");
 
  return (
    <Container>
      {renderVerifyUnwrapped({ modelId: device.modelId, type })}
    </Container>
  );
};

export default InstallLanguageConfirm;
