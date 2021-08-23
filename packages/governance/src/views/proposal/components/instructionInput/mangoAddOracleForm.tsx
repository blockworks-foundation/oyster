import React from 'react';
import { Form, FormInstance } from 'antd';
import { TransactionInstruction } from '@solana/web3.js';

import { ExplorerLink, ParsedAccount } from '@oyster/common';

import { Governance } from '../../../../models/accounts';
import { formDefaults } from '../../../../tools/forms';
import { AccountFormItem } from '../../../../components/AccountFormItem/accountFormItem';
import { PublicKey } from '@solana/web3.js';
import {
  Config,
  makeAddOracleInstruction,
} from '@blockworks-foundation/mango-client';

export const MangoAddOracleForm = ({
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
    oracleId,
  }: {
    mangoGroupId: string;
    marketIndex: number;
    oracleId: string;
  }) => {
    const mangoGroup = new PublicKey(mangoGroupId);
    const groupConfig = Config.ids().groups.find(c =>
      c.publicKey.equals(mangoGroup),
    )!;

    const instruction = makeAddOracleInstruction(
      groupConfig.mangoProgramId,
      mangoGroup,
      new PublicKey(oracleId),
      governance.pubkey,
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
        name="oracleId"
        label="oracle account"
        required
      ></AccountFormItem>
    </Form>
  );
};
