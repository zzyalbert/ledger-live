import { setup } from "../../__tests__/test-helpers/libcore-setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import dataset from "./test-dataset";

setup("cardano_testnet");
testBridge("cardano_testnet", dataset);
