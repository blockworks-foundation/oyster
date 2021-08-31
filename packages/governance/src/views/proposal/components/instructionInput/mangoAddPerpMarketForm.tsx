import {
  BookSideLayout,
  Config,
  createAccountInstruction,
  I80F48,
  makeAddPerpMarketInstruction,
  MangoClient,
  PerpEventLayout,
  PerpEventQueueHeaderLayout,
  PerpMarketLayout,
} from '@blockworks-foundation/mango-client';
import {
  ExplorerLink,
  ParsedAccount,
  useConnection,
  useWallet,
} from '@oyster/common';
import * as common from '@project-serum/common';
import {
  Account,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { Form, FormInstance, Input } from 'antd';
import BN from 'bn.js';
import React from 'react';
import { AccountFormItem } from '../../../../components/AccountFormItem/accountFormItem';
import { Governance } from '../../../../models/accounts';
import { formDefaults } from '../../../../tools/forms';

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
    maxNumEvents,
    targetPeriodLength,
    mngoPerPeriod,
  }: {
    mangoGroupId: string;
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
    maxNumEvents: number;
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

    const mngoToken = groupConfig.tokens.filter(token => {
      return token.symbol === 'MNGO';
    })[0];

    const provider = new common.Provider(
      connection,
      { ...wallet!, publicKey: wallet!.publicKey! },
      common.Provider.defaultOptions(),
    );

    const tx = new Transaction();
    const addToTx = async (instructions: Promise<TransactionInstruction[]>) => {
      for (let ins of await instructions) {
        tx.add(ins);
      }
    };

    const makePerpMarketAccountInstruction = await createAccountInstruction(
      connection,
      provider.wallet.publicKey,
      PerpMarketLayout.span,
      groupConfig.mangoProgramId,
    );
    tx.add(makePerpMarketAccountInstruction.instruction);

    const makeEventQueueAccountInstruction = await createAccountInstruction(
      connection,
      provider.wallet.publicKey,
      PerpEventQueueHeaderLayout.span + maxNumEvents * PerpEventLayout.span,
      groupConfig.mangoProgramId,
    );
    tx.add(makeEventQueueAccountInstruction.instruction);

    const makeBidAccountInstruction = await createAccountInstruction(
      connection,
      provider.wallet.publicKey,
      BookSideLayout.span,
      groupConfig.mangoProgramId,
    );
    tx.add(makeBidAccountInstruction.instruction);

    const makeAskAccountInstruction = await createAccountInstruction(
      connection,
      provider.wallet.publicKey,
      BookSideLayout.span,
      groupConfig.mangoProgramId,
    );
    tx.add(makeAskAccountInstruction.instruction);

    const mngoVaultAccount = new Account();
    await addToTx(
      common.createTokenAccountInstrs(
        provider,
        mngoVaultAccount.publicKey,
        new PublicKey(mngoToken.mintKey),
        mangoGroup.signerKey,
      ),
    );

    tx.recentBlockhash = (await connection.getRecentBlockhash('max')).blockhash;

    const signers = [
      makePerpMarketAccountInstruction.account,
      makeEventQueueAccountInstruction.account,
      makeBidAccountInstruction.account,
      makeAskAccountInstruction.account,
      mngoVaultAccount,
    ];
    tx.setSigners(wallet!.publicKey!, ...signers.map(s => s.publicKey));
    if (signers.length > 0) {
      tx.partialSign(...signers);
    }
    const signed = await wallet?.signTransaction(tx);
    const txid = await connection.sendRawTransaction(signed!.serialize());

    console.log('created accounts', txid);

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

      <Form.Item name="marketIndex" label="market index" required>
        <Input type="number" />
      </Form.Item>

      <Form.Item
        name="maintLeverage"
        label="maintenance position leverage"
        initialValue={20}
        required
      >
        <Input type="number" />
      </Form.Item>

      <Form.Item
        name="initLeverage"
        label="initial position leverage"
        initialValue={10}
        required
      >
        <Input type="number" />
      </Form.Item>

      <Form.Item
        name="liquidationFee"
        label="liquidation fee"
        initialValue={0.025}
        required
      >
        <Input type="number" />
      </Form.Item>

      <Form.Item name="makerFee" label="maker fee" initialValue={0.0} required>
        <Input type="number" />
      </Form.Item>

      <Form.Item
        name="takerFee"
        label="taker fee"
        initialValue={0.0005}
        required
      >
        <Input type="number" />
      </Form.Item>

      <Form.Item
        name="baseLotSize"
        label="base lot size"
        initialValue={100}
        required
      >
        <Input type="number" />
      </Form.Item>

      <Form.Item
        name="quoteLotSize"
        label="quote lot size"
        initialValue={10}
        required
      >
        <Input type="number" />
      </Form.Item>

      <Form.Item
        name="maxNumEvents"
        label="max number of events"
        initialValue={256}
        required
      >
        <Input type="number" />
      </Form.Item>

      <Form.Item name="rate" label="rate" initialValue={1} required>
        <Input type="number" />
      </Form.Item>

      <Form.Item
        name="maxDepthBps"
        label="max depth bps"
        initialValue={200}
        required
      >
        <Input type="number" />
      </Form.Item>

      <Form.Item
        name="targetPeriodLength"
        label="Target period length"
        initialValue={3600}
        required
      >
        <Input type="number" />
      </Form.Item>

      <Form.Item
        name="mngoPerPeriod"
        label="mngo per period"
        initialValue={11400}
        required
      >
        <Input type="number" />
      </Form.Item>
    </Form>
  );
};
