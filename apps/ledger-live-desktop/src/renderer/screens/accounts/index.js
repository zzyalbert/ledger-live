// @flow
import React, { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import type { Account, TokenAccount } from "@ledgerhq/live-common/lib/types";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import TrackPage, { setTrackingSource } from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import { Redirect } from "react-router";
import { TopBannerContainer } from "~/renderer/screens/dashboard";
import {
  useFlattenSortAccounts,
  useRefreshAccountsOrderingEffect,
} from "~/renderer/actions/general";
import { accountsSelector, starredAccountsSelector } from "~/renderer/reducers/accounts";
import { accountsViewModeSelector, selectedTimeRangeSelector } from "~/renderer/reducers/settings";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { getEnv } from "@ledgerhq/live-common/lib/env";
import AccountList from "./AccountList";
import { command } from "~/renderer/commands";
import AccountsHeader from "./AccountsHeader";
import MigrationBanner from "~/renderer/modals/MigrateAccounts/Banner";
import { createAction } from "@ledgerhq/live-common/lib/hw/actions/installLanguage";
import Button from "~/renderer/components/Button";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import DeviceAction from "~/renderer/components/DeviceAction";


const installLanguageExec = command("installLanguage");
const installLanguageAction = createAction(getEnv("MOCK") ? mockedEventEmitter : installLanguageExec);

export default function AccountsPage() {
  const mode = useSelector(accountsViewModeSelector);
  const range = useSelector(selectedTimeRangeSelector);
  const rawAccounts = useSelector(accountsSelector);
  const starredAccounts = useSelector(starredAccountsSelector);
  const flattenedAccounts = useFlattenSortAccounts({ enforceHideEmptySubAccounts: true });
  const accounts = mode === "card" ? flattenedAccounts : rawAccounts;

  
  const currentDevice = useSelector(getCurrentDevice);
  const history = useHistory();

  useRefreshAccountsOrderingEffect({ onMount: true });

  const onAccountClick = useCallback(
    (account: Account | TokenAccount, parentAccount: ?Account) => {
      setTrackingSource("accounts page");
      history.push({
        pathname: parentAccount
          ? `/account/${parentAccount.id}/${account.id}`
          : `/account/${account.id}`,
      });
    },
    [history],
  );

  const [installingLanguage, setInstallingLanguage] = useState(false);
  
  if(installingLanguage) {
    console.log("installLanguage - device", currentDevice);
    return <DeviceAction action={installLanguageAction} request="french" />
  }

  if (!accounts.length) {
    return <Redirect to="/" />;
  }

  return (
    <Box>
      <TrackPage
        category="Accounts"
        accountsLength={accounts.length}
        starredAccountsLength={starredAccounts.length}
        mode={mode}
      />
      <Button onClick={() => setInstallingLanguage(true)}>
        Install French on your device
      </Button>
      <TopBannerContainer>
        <MigrationBanner />
      </TopBannerContainer>
      <AccountsHeader />
      <AccountList onAccountClick={onAccountClick} accounts={accounts} range={range} mode={mode} />
    </Box>
  );
}

export const GenericBox: ThemedComponent<{}> = styled(Box)`
  background: ${p => p.theme.colors.palette.background.paper};
  flex: 1;
  padding: 10px 20px;
  margin-bottom: 9px;
  color: #abadb6;
  font-weight: 600;
  align-items: center;
  justify-content: flex-start;
  display: flex;
  flex-direction: row;
  border-radius: 4px;
  box-shadow: 0 4px 8px 0 #00000007;
`;
