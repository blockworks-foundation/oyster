import React from 'react';
import { Form, FormInstance, Input } from 'antd';
import { TransactionInstruction } from '@solana/web3.js';

import { ExplorerLink, ParsedAccount } from '@oyster/common';

import { Governance } from '../../../../models/accounts';
import { formDefaults } from '../../../../tools/forms';
import { AccountFormItem } from '../../../../components/AccountFormItem/accountFormItem';
import { PublicKey } from '@solana/web3.js';
import {
  Config,
  I80F48,
  makeChangePerpMarketParams2Instruction,
  optionalBNFromString,
} from '@blockworks-foundation/mango-client';
import BN from 'bn.js';

export const MangoChangePerpMarketForm = ({
  form,
  governance,
  onCreateInstruction,
}: {
  form: FormInstance;
  governance: ParsedAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) => {
  const onCreate = async ({
    mangoGroupId,
    perpMarketId,
    rate,
    maxDepthBps,
    exp,
    mngoPerPeriod,
    maintLeverage,
    initLeverage,
    makerFee,
    takerFee,
    liquidationFee,
    version,
    lmSizeShift,
  }: {
    mangoGroupId: string;
    perpMarketId: string;
    rate?: string;
    maxDepthBps?: string;
    exp?: string;
    mngoPerPeriod?: string;
    maintLeverage?: string;
    initLeverage?: string;
    makerFee?: string;
    takerFee?: string;
    liquidationFee?: string;
    version?: string;
    lmSizeShift?: string;
  }) => {
    const mangoGroup = new PublicKey(mangoGroupId);
    const perpMarket = new PublicKey(perpMarketId);
    const groupConfig = Config.ids().groups.find(c =>
      c.publicKey.equals(mangoGroup),
    )!;

    const instruction = makeChangePerpMarketParams2Instruction(
      groupConfig.mangoProgramId,
      mangoGroup,
      perpMarket,
      governance.pubkey,
      I80F48.fromOptionalString(maintLeverage),
      I80F48.fromOptionalString(initLeverage),
      I80F48.fromOptionalString(liquidationFee),
      I80F48.fromOptionalString(makerFee),
      I80F48.fromOptionalString(takerFee),
      I80F48.fromOptionalString(rate),
      I80F48.fromOptionalString(maxDepthBps),
      undefined,
      mngoPerPeriod
        ? new BN(
            Math.round(((mngoPerPeriod as any) as number) * Math.pow(10, 6)),
          )
        : undefined,
      optionalBNFromString(exp),
      optionalBNFromString(version),
      optionalBNFromString(lmSizeShift),
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
        name="perpMarketId"
        label="perp market"
        required
      ></AccountFormItem>

      <Form.Item name="rate" label="initial value for dynamic rate">
        <Input type="number" placeholder="0.00001" />
      </Form.Item>

      <Form.Item
        name="maxDepthBps"
        label="maximum incentivized order book depth"
      >
        <Input type="number" placeholder="100" />
      </Form.Item>

      <Form.Item name="exp" label="order book depth weight exponent">
        <Input type="number" />
      </Form.Item>

      <Form.Item name="mngoPerPeriod" label="MNGO per period">
        <Input type="number" />
      </Form.Item>

      <Form.Item name="makerFee" label="Maker fee">
        <Input type="number" />
      </Form.Item>

      <Form.Item name="takerFee" label="Taker fee">
        <Input type="number" />
      </Form.Item>

      <Form.Item name="maintLeverage" label="Maint leverage">
        <Input type="number" />
      </Form.Item>

      <Form.Item name="initLeverage" label="Init leverage">
        <Input type="number" />
      </Form.Item>

      <Form.Item name="liquidationFee" label="Liquidation fee">
        <Input type="number" />
      </Form.Item>
      <Form.Item name="version" label="Version">
        <Input type="number" />
      </Form.Item>
      <Form.Item
        name="lmSizeShift"
        label="LM Size Shift: x such that maxSizeDepth / 2 ^ x is between 1 and 100"
      >
        <Input type="number" />
      </Form.Item>
    </Form>
  );
};
