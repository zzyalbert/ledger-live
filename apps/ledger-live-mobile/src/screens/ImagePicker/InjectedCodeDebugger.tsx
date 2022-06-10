import React, { useCallback, useState } from "react";
import { Alert, Switch, Text } from "@ledgerhq/native-ui";
import { ScrollView } from "react-native";

export function InjectedCodeDebugger({
  injectedCode,
}: {
  injectedCode: string;
}) {
  const [sourceVisible, setSourceVisible] = useState(false);
  const toggleShowSource = useCallback(() => {
    setSourceVisible(!sourceVisible);
  }, [setSourceVisible, sourceVisible]);
  const warningVisible = injectedCode?.trim() === "[bytecode]"; // see https://github.com/facebook/hermes/issues/612
  return (
    <>
      <Switch
        checked={sourceVisible}
        onChange={toggleShowSource}
        label="Show injected code"
      />
      {sourceVisible && (
        <ScrollView horizontal>
          <Text>{injectedCode}</Text>
        </ScrollView>
      )}
      {warningVisible && (
        <Alert
          type="error"
          title="Injected code not properly stringified, please save the injectedCode.js file to trigger a hot reload & it will work fine"
        />
      )}
    </>
  );
}
