/* @flow */
import React, { PureComponent, Fragment } from "react";
import { View, StyleSheet } from "react-native";
import type { Account, Operation } from "@ledgerhq/live-common/lib/types";
import uniq from "lodash/uniq";
import { translate } from "react-i18next";
import LText from "../../components/LText";
import OperationIcon from "../../components/OperationIcon";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import colors from "../../colors";
import type { T } from "../../types/common";
import DataList from "./DataList";

type Props = {
  t: T,
  account: Account,
  operation: Operation,
};

class Content extends PureComponent<Props, *> {
  // NOTE some const temp hardcoded for testing purposes
  render() {
    const { account, operation, t } = this.props;
    const valueColor = operation.type === "IN" ? colors.green : colors.smoke;
    const confirmations = operation.blockHeight
      ? account.blockHeight - operation.blockHeight
      : 0;
    // const uniqueSenders = uniq(operation.senders);
    const uniqueSenders = [
      "15YftVBGtvLtW3Bshd7wkyNqJw1WnCudEcH",
      "77YftVBGtvLtW3Bshd7wkyNqJw1WnCudTyh",
      "88YftVBGtvLtW3Bshd7wkyNqJw1WnCudTyh",
      "99YftVBGtvLtW3Bshd7wkyNqJw1WnCudTyh",
    ];
    const uniqueRecipients = uniq(operation.recipients);

    // const isConfirmed = confirmations >= currencySettings.confirmationsNb
    const isConfirmed = confirmations >= 2;

    return (
      <Fragment>
        <View style={styles.header}>
          <View style={styles.icon}>
            <OperationIcon size={20} containerSize={40} type={operation.type} />
          </View>
          <LText
            tertiary
            style={[styles.currencyUnitValue, { color: valueColor }]}
          >
            <CurrencyUnitValue
              showCode
              unit={account.unit}
              value={operation.value}
              alwaysShowSign
            />
          </LText>
          <LText style={styles.counterValue}>
            <CounterValue
              showCode
              alwaysShowSign
              currency={account.currency}
              value={operation.value}
            />
          </LText>
          <View style={styles.confirmationContainer}>
            <View
              style={[
                styles.bulletPoint,
                { backgroundColor: isConfirmed ? colors.green : colors.grey },
              ]}
            />
            {isConfirmed ? (
              <LText style={[styles.confirmation, { color: colors.green }]}>
                {t("common:operationDetails.confirmed")}
              </LText>
            ) : (
              <LText style={[styles.confirmation, { color: colors.grey }]}>
                {t("common:operationDetails.notConfirmed")}
              </LText>
            )}
          </View>
        </View>
        <View style={styles.body}>
          <View style={styles.section}>
            <LText style={styles.sectionTitle}>
              {t("common:operationDetails.account")}
            </LText>
            <LText semiBold>{account.name}</LText>
          </View>
          <View style={styles.section}>
            <LText style={styles.sectionTitle}>
              {t("common:operationDetails.date")}
            </LText>
            <LText semiBold>
              {operation.date.toLocaleDateString([], {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </LText>
          </View>
          <View style={styles.section}>
            <LText style={styles.sectionTitle}>
              {t("common:operationDetails.fees")}
            </LText>
            {operation.fee ? (
              <LText semiBold>
                <CurrencyUnitValue
                  showCode
                  unit={account.unit}
                  value={operation.fee}
                />
              </LText>
            ) : (
              <LText semiBold>{t("common:operationDetails.noFees")}</LText>
            )}
          </View>
          <View style={styles.section}>
            <LText style={styles.sectionTitle}>
              {t("common:operationDetails.identifier")}
            </LText>
            <LText semiBold>{operation.hash}</LText>
          </View>
          <View style={styles.section}>
            <DataList
              data={uniqueSenders}
              t={t}
              title={t("common:operationDetails.from", {
                count: uniqueSenders.length,
              })}
              titleStyle={styles.sectionTitle}
            />
          </View>
          <View style={styles.section}>
            <DataList
              data={uniqueRecipients}
              t={t}
              title={t("common:operationDetails.to", {
                count: uniqueRecipients.length,
              })}
            />
          </View>
        </View>
      </Fragment>
    );
  }
}

export default translate()(Content);

const styles = StyleSheet.create({
  root: {
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingTop: 20,
    maxHeight: 550,
  },
  header: {
    alignItems: "center",
  },

  body: {
    marginHorizontal: 16,
  },
  icon: {
    marginBottom: 16,
  },
  currencyUnitValue: {
    fontSize: 20,
    marginBottom: 8,
    color: colors.smoke,
  },
  counterValue: {
    fontSize: 14,
    color: colors.grey,
    marginBottom: 16,
  },
  confirmationContainer: {
    flexDirection: "row",
    marginBottom: 24,
    justifyContent: "center",
  },
  confirmation: {
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    color: colors.grey,
    marginBottom: 8,
  },
  bulletPoint: {
    borderRadius: 50,
    height: 6,
    width: 6,
    marginRight: 5,
    alignSelf: "center",
  },
});
