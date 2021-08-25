import React from 'react';
import { Form, FormInstance, Input } from 'antd';
import { Account, Transaction, TransactionInstruction } from '@solana/web3.js';
import * as common from '@project-serum/common';
import * as serum from '@project-serum/serum';

import {
  ExplorerLink,
  ParsedAccount,
  useConnection,
  useWallet,
} from '@oyster/common';

import { Governance } from '../../../../models/accounts';
import { formDefaults } from '../../../../tools/forms';
import { AccountFormItem } from '../../../../components/AccountFormItem/accountFormItem';
import { PublicKey } from '@solana/web3.js';
import {
  BookSideLayout,
  Config,
  createAccountInstruction,
  createTokenAccountInstructions,
  getTokenBySymbol,
  I80F48,
  makeAddPerpMarketInstruction,
  MangoClient,
  NodeBankLayout,
  PerpEventLayout,
  PerpEventQueueHeaderLayout,
  PerpMarketLayout,
  RootBankLayout,
} from '@blockworks-foundation/mango-client';
import BN from 'bn.js';

export const MangoAddPerpMarketForm = ({
  form,
  governance,
  onCreateInstruction,
}: {
  form: FormInstance;
  governance: ParsedAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) => {
  const connection = useConnection();
  const { wallet } = useWallet();

  const onCreate = async ({
    mangoGroupId,
    marketId,
    marketIndex,
    maintLeverage,
    initLeverage,
    liquidationFee,
    makerFee,
    takerFee,
    baseLotSize,
    quoteLotSize,
    rate,
    maxDepthBps,
    targetPeriodLength,
    mngoPerPeriod,
  }: {
    mangoGroupId: string;
    marketId: string;
    marketIndex: number;
    maintLeverage: number;
    initLeverage: number;
    liquidationFee: number;
    makerFee: number;
    takerFee: number;
    baseLotSize: number;
    quoteLotSize: number;
    rate: number;
    maxDepthBps: number;
    targetPeriodLength: number;
    mngoPerPeriod: number;
  }) => {
    const groupConfig = Config.ids().groups.find(c =>
      c.publicKey.equals(new PublicKey(mangoGroupId)),
    )!;

    const mangoGroup = await new MangoClient(
      connection,
      groupConfig.mangoProgramId,
    ).getMangoGroup(groupConfig.publicKey);

    const makePerpMarketAccountInstruction = await createAccountInstruction(
      connection,
      governance.pubkey,
      PerpMarketLayout.span,
      groupConfig.mangoProgramId,
    );

    const makeEventQueueAccountInstruction = await createAccountInstruction(
      connection,
      governance.pubkey,
      PerpEventQueueHeaderLayout.span + maxNumEvents * PerpEventLayout.span,
      groupConfig.mangoProgramId,
    );

    const makeBidAccountInstruction = await createAccountInstruction(
      connection,
      governance.pubkey,
      BookSideLayout.span,
      groupConfig.mangoProgramId,
    );

    const makeAskAccountInstruction = await createAccountInstruction(
      connection,
      governance.pubkey,
      BookSideLayout.span,
      groupConfig.mangoProgramId,
    );

    const mngoVaultAccount = new Account();
    const mngoVaultAccountInstructions = await createTokenAccountInstructions(
      connection,
      governance.pubkey,
      mngoVaultAccount.publicKey,
      mngoMintPk,
      mangoGroup.signerKey,
    );

    const instruction = await makeAddPerpMarketInstruction(
      groupConfig.mangoProgramId,
      mangoGroup.publicKey,
      makePerpMarketAccountInstruction.account.publicKey,
      makeEventQueueAccountInstruction.account.publicKey,
      makeBidAccountInstruction.account.publicKey,
      makeAskAccountInstruction.account.publicKey,
      mngoVaultAccount.publicKey,
      governance.pubkey,
      new BN(marketIndex),
      I80F48.fromNumber(maintLeverage),
      I80F48.fromNumber(initLeverage),
      I80F48.fromNumber(liquidationFee),
      I80F48.fromNumber(makerFee),
      I80F48.fromNumber(takerFee),
      new BN(baseLotSize),
      new BN(quoteLotSize),
      I80F48.fromNumber(rate),
      I80F48.fromNumber(maxDepthBps),
      new BN(targetPeriodLength),
      new BN(mngoPerPeriod),
    );

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

      <AccountFormItem
        name="marketId"
        label="perp market"
        required
      ></AccountFormItem>

      <Form.Item name="marketIndex" label="market index" required>
        <Input type="number" />
      </Form.Item>

      <Form.Item
        name="maintLeverage"
        label="maintenance position leverage"
        initialValue={10}
        required
      >
        <Input type="number" />
      </Form.Item>

      <Form.Item
        name="initLeverage"
        label="initial position leverage"
        initialValue={5}
        required
      >
        <Input type="number" />
      </Form.Item>

      <Form.Item
        name="liquidationFee"
        label="liquidation fee"
        initialValue={0.05}
        required
      >
        <Input type="number" />
      </Form.Item>

      <Form.Item name="makerFee" label="maker fee" initialValue={0.05} required>
        <Input type="number" />
      </Form.Item>

      <Form.Item name="takerFee" label="taker fee" initialValue={0.05} required>
        <Input type="number" />
      </Form.Item>

      <Form.Item
        name="baseLotSize"
        label="base lot size"
        initialValue={0.05}
        required
      >
        <Input type="number" />
      </Form.Item>

      <Form.Item
        name="quoteLotSize"
        label="quote lot size"
        initialValue={0.05}
        required
      >
        <Input type="number" />
      </Form.Item>

      <Form.Item name="rate" label="rate" initialValue={0.05} required>
        <Input type="number" />
      </Form.Item>

      <Form.Item
        name="maxDepthBps"
        label="max depth bps"
        initialValue={0.05}
        required
      >
        <Input type="number" />
      </Form.Item>

      <Form.Item
        name="targetPeriodLength"
        label="Target period length"
        initialValue={0.05}
        required
      >
        <Input type="number" />
      </Form.Item>

      <Form.Item
        name="mngoPerPeriod"
        label="mngo per period"
        initialValue={0.05}
        required
      >
        <Input type="number" />
      </Form.Item>
    </Form>
  );
};
