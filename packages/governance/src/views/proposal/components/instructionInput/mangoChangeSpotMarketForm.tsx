import React from 'react';
import { Form, FormInstance, Input } from 'antd';
import { TransactionInstruction } from '@solana/web3.js';

import { ExplorerLink, ParsedAccount, useConnection } from '@oyster/common';

import { Governance } from '../../../../models/accounts';
import { formDefaults } from '../../../../tools/forms';
import { AccountFormItem } from '../../../../components/AccountFormItem/accountFormItem';
import { PublicKey } from '@solana/web3.js';
import {
  Config,
  getSpotMarketByBaseSymbol,
  getTokenBySymbol,
  I80F48,
  makeChangeSpotMarketParamsInstruction,
  optionalBNFromString,
  MangoClient,
} from '@blockworks-foundation/mango-client';
import { Market } from '@project-serum/serum';

export const MangoChangeSpotMarketForm = ({
  form,
  governance,
  onCreateInstruction,
}: {
  form: FormInstance;
  governance: ParsedAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) => {
  const connection = useConnection();
  const onCreate = async ({
    mangoGroupId,
    symbol,
    maintLeverage,
    initLeverage,
    liquidationFee,
    optimalUtil,
    optimalRate,
    maxRate,
    version,
  }: {
    mangoGroupId: string;
    symbol: string;
    maintLeverage?: string;
    initLeverage?: string;
    liquidationFee?: string;
    optimalUtil?: string;
    optimalRate?: string;
    maxRate?: string;
    version?: string;
  }) => {
    const mangoGroupPk = new PublicKey(mangoGroupId);
    const groupConfig = Config.ids().groups.find(c =>
      c.publicKey.equals(mangoGroupPk),
    )!;

    const client = new MangoClient(connection, groupConfig.mangoProgramId);
    const mangoGroup = await client.getMangoGroup(groupConfig.publicKey);

    const spotMarketConfig = getSpotMarketByBaseSymbol(groupConfig, symbol);
    const spotMarket = await Market.load(
      connection,
      spotMarketConfig!.publicKey,
      undefined,
      groupConfig.serumProgramId,
    );
    const rootBanks = await mangoGroup.loadRootBanks(connection);
    const tokenBySymbol = getTokenBySymbol(groupConfig, symbol);
    const tokenIndex = mangoGroup.getTokenIndex(tokenBySymbol.mintKey);
    const rootBank = rootBanks[tokenIndex];

    const instruction = makeChangeSpotMarketParamsInstruction(
      groupConfig.mangoProgramId,
      mangoGroup.publicKey,
      spotMarket.publicKey,
      rootBank!.publicKey,
      governance.pubkey,
      I80F48.fromOptionalString(maintLeverage),
      I80F48.fromOptionalString(initLeverage),
      I80F48.fromOptionalString(liquidationFee),
      I80F48.fromOptionalString(optimalUtil),
      I80F48.fromOptionalString(optimalRate),
      I80F48.fromOptionalString(maxRate),
      optionalBNFromString(version),
    );

    console.log('changeSpot', {
      maintLeverage,
      initLeverage,
      liquidationFee,
      optimalUtil,
      optimalRate,
      maxRate,
      version,
    });
    onCreateInstruction(instruction);
  };

  return (
    <Form {...formDefaults} form={form} onFinish={onCreate}>
      <Form.Item label="program id">
        <ExplorerLink
          address={governance.info.governedAccount}
          type="address"
        />
      </Form.Item>

      <AccountFormItem
        name="mangoGroupId"
        label="mango group"
        required
      ></AccountFormItem>

      <Form.Item name="symbol" label="spot market base symbol">
        <Input type="string" placeholder="" />
      </Form.Item>

      <Form.Item name="maintLeverage" label="Maint leverage">
        <Input type="number" placeholder="" />
      </Form.Item>

      <Form.Item name="initLeverage" label="Init leverage">
        <Input type="number" placeholder="" />
      </Form.Item>

      <Form.Item name="liquidationFee" label="Liquidation fee">
        <Input type="number" placeholder="" />
      </Form.Item>

      <Form.Item name="optimalUtil" label="optimal utilization ratio">
        <Input type="number" placeholder="" />
      </Form.Item>

      <Form.Item name="optimalRate" label="optimal utilization APR">
        <Input type="number" placeholder="" />
      </Form.Item>

      <Form.Item name="maxRate" label="maximum APR">
        <Input type="number" placeholder="" />
      </Form.Item>

      <Form.Item name="version" label="version">
        <Input type="number" placeholder="" />
      </Form.Item>
    </Form>
  );
};
