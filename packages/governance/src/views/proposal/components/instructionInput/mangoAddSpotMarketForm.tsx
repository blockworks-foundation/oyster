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
  Config,
  createAccountInstruction,
  getTokenBySymbol,
  I80F48,
  makeAddSpotMarketInstruction,
  MangoClient,
  NodeBankLayout,
  RootBankLayout,
} from '@blockworks-foundation/mango-client';

export const MangoAddSpotMarketForm = ({
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
    oracleId,
    marketId,
    maintLeverage,
    initLeverage,
    liquidationFee,
    optimalUtil,
    optimalRate,
    maxRate,
  }: {
    mangoGroupId: string;
    oracleId: string;
    marketId: string;
    maintLeverage: number;
    initLeverage: number;
    liquidationFee: number;
    optimalUtil: number;
    optimalRate: number;
    maxRate: number;
  }) => {
    const groupConfig = Config.ids().groups.find(c =>
      c.publicKey.equals(new PublicKey(mangoGroupId)),
    )!;
    const quoteMint = getTokenBySymbol(groupConfig, groupConfig.quoteSymbol);

    const mangoGroup = await new MangoClient(
      connection,
      groupConfig.mangoProgramId,
    ).getMangoGroup(groupConfig.publicKey);

    const provider = new common.Provider(
      connection,
      { ...wallet!, publicKey: wallet!.publicKey! },
      common.Provider.defaultOptions(),
    );
    const oracle = new PublicKey(oracleId);
    const market = new PublicKey(marketId);
    const marketInfo = await serum.Market.load(
      connection,
      market,
      undefined,
      groupConfig.serumProgramId,
    );

    if (!marketInfo.quoteMintAddress.equals(quoteMint.mintKey)) {
      throw new Error('invalid market');
    }

    const tx = new Transaction();
    const addToTx = async (instructions: Promise<TransactionInstruction[]>) => {
      for (let ins of await instructions) {
        tx.add(ins);
      }
    };

    const baseVault = new Account();
    await addToTx(
      common.createTokenAccountInstrs(
        provider,
        baseVault.publicKey,
        marketInfo.baseMintAddress,
        mangoGroup.signerKey,
      ),
    );

    const nodeBank = await createAccountInstruction(
      connection,
      provider.wallet.publicKey,
      NodeBankLayout.span,
      groupConfig.mangoProgramId,
    );
    tx.add(nodeBank.instruction);

    const rootBank = await createAccountInstruction(
      connection,
      provider.wallet.publicKey,
      RootBankLayout.span,
      groupConfig.mangoProgramId,
    );
    tx.add(rootBank.instruction);

    tx.recentBlockhash = (await connection.getRecentBlockhash('max')).blockhash;

    const signers = [baseVault, nodeBank.account, rootBank.account];
    tx.setSigners(wallet!.publicKey!, ...signers.map(s => s.publicKey));
    if (signers.length > 0) {
      tx.partialSign(...signers);
    }
    const signed = await wallet?.signTransaction(tx);
    const txid = await connection.sendRawTransaction(signed!.serialize());

    console.log('created accounts', txid);

    const instruction = makeAddSpotMarketInstruction(
      groupConfig.mangoProgramId,
      mangoGroup.publicKey,
      oracle,
      market,
      mangoGroup.dexProgramId,
      marketInfo.baseMintAddress,
      nodeBank.account.publicKey,
      baseVault.publicKey,
      rootBank.account.publicKey,
      governance.pubkey,
      I80F48.fromNumber(maintLeverage),
      I80F48.fromNumber(initLeverage),
      I80F48.fromNumber(liquidationFee),
      I80F48.fromNumber(optimalUtil),
      I80F48.fromNumber(optimalRate),
      I80F48.fromNumber(maxRate),
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

      <AccountFormItem
        name="marketId"
        label="spot market"
        required
      ></AccountFormItem>

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
      <Form.Item
        name="optimalUtil"
        label="optimal pool utilization"
        initialValue={0.7}
        required
      >
        <Input type="number" />
      </Form.Item>
      <Form.Item
        name="optimalRate"
        label="optimal pool interest rate"
        initialValue={0.06}
        required
      >
        <Input type="number" />
      </Form.Item>

      <Form.Item
        name="maxRate"
        label="maximum pool interest rate"
        initialValue={1.5}
        required
      >
        <Input type="number" />
      </Form.Item>
    </Form>
  );
};
