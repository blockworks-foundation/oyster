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
  makeChangePerpMarketParamsInstruction,
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
  }: {
    mangoGroupId: string;
    perpMarketId: string;
    rate: number;
    maxDepthBps: number;
    exp: number;
    mngoPerPeriod: number;
    maintLeverage: number;
    initLeverage: number;
    makerFee: number;
    takerFee: number;
    liquidationFee: number;
  }) => {
    const mangoGroup = new PublicKey(mangoGroupId);
    const perpMarket = new PublicKey(perpMarketId);
    const groupConfig = Config.ids().groups.find(c =>
      c.publicKey.equals(mangoGroup),
    )!;

    const instruction = makeChangePerpMarketParamsInstruction(
      groupConfig.mangoProgramId,
      mangoGroup,
      perpMarket,
      governance.pubkey,
      maintLeverage ? I80F48.fromNumberOrUndef(maintLeverage) : undefined,
      initLeverage ? I80F48.fromNumberOrUndef(initLeverage) : undefined,
      liquidationFee ? I80F48.fromNumberOrUndef(liquidationFee) : undefined,
      makerFee ? I80F48.fromNumberOrUndef(makerFee) : undefined,
      takerFee ? I80F48.fromNumberOrUndef(takerFee) : undefined,
      rate ? I80F48.fromNumberOrUndef(rate) : undefined,
      maxDepthBps ? I80F48.fromNumberOrUndef(maxDepthBps) : undefined,
      undefined,
      mngoPerPeriod
        ? new BN(Math.round(mngoPerPeriod * Math.pow(10, 6)))
        : undefined,
      exp ? new BN(exp) : undefined,
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
    </Form>
  );
};
