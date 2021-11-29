import {
  BookSideLayout,
  Config,
  createAccountInstruction,
  I80F48,
  makeCreatePerpMarketInstruction,
  MangoClient,
  PerpEventLayout,
  PerpEventQueueHeaderLayout,
} from '@blockworks-foundation/mango-client';
import {
  ExplorerLink,
  ParsedAccount,
  useConnection,
  useWallet,
} from '@oyster/common';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
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
import * as common from '@project-serum/common';

export const MangoCreatePerpMarketForm = ({
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
    maintLeverage,
    initLeverage,
    liquidationFee,
    makerFee,
    takerFee,
    baseLotSize,
    quoteLotSize,
    rate,
    maxDepthBps,
    exp,
    maxNumEvents,
    targetPeriodLength,
    mngoPerPeriod,
    version,
    lmSizeShift,
    baseDecimals,
  }: {
    mangoGroupId: string;
    oracleId: string;
    maintLeverage: number;
    initLeverage: number;
    liquidationFee: number;
    makerFee: number;
    takerFee: number;
    baseLotSize: number;
    quoteLotSize: number;
    rate: number;
    maxDepthBps: number;
    exp: number;
    maxNumEvents: number;
    targetPeriodLength: number;
    mngoPerPeriod: number;
    version: number;
    lmSizeShift: number;
    baseDecimals: number;
  }) => {
    const groupConfig = Config.ids().groups.find(c =>
      c.publicKey.equals(new PublicKey(mangoGroupId)),
    )!;

    const oraclePk = new PublicKey(oracleId);

    const mangoGroup = await new MangoClient(
      connection,
      groupConfig.mangoProgramId,
    ).getMangoGroup(groupConfig.publicKey);

    const mngoToken = groupConfig.tokens.filter(token => {
      return token.symbol === 'MNGO';
    })[0];
    const mngoMintPk = mngoToken.mintKey;

    const provider = new common.Provider(
      connection,
      { ...wallet!, publicKey: wallet!.publicKey! },
      common.Provider.defaultOptions(),
    );
    const tx = new Transaction();

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

    tx.recentBlockhash = (await connection.getRecentBlockhash('max')).blockhash;
    const signers = [
      makeEventQueueAccountInstruction.account,
      makeBidAccountInstruction.account,
      makeAskAccountInstruction.account,
    ];
    tx.feePayer = wallet!.publicKey!;
    tx.partialSign(...signers);
    const signed = await wallet?.signTransaction(tx);
    const txid = await connection.sendRawTransaction(signed!.serialize());
    console.log('created accounts', txid);

    const [perpMarketPk] = await PublicKey.findProgramAddress(
      [
        mangoGroup.publicKey.toBytes(),
        new Buffer('PerpMarket', 'utf-8'),
        oraclePk.toBytes(),
      ],
      groupConfig.mangoProgramId,
    );

    const [mngoVaultPk] = await PublicKey.findProgramAddress(
      [
        perpMarketPk.toBytes(),
        TOKEN_PROGRAM_ID.toBytes(),
        mngoMintPk.toBytes(),
      ],
      groupConfig.mangoProgramId,
    );

    const instruction = await makeCreatePerpMarketInstruction(
      groupConfig.mangoProgramId,
      mangoGroup.publicKey,
      oraclePk,
      perpMarketPk,
      makeEventQueueAccountInstruction.account.publicKey,
      makeBidAccountInstruction.account.publicKey,
      makeAskAccountInstruction.account.publicKey,
      mngoMintPk,
      mngoVaultPk,
      governance.pubkey,
      mangoGroup.signerKey,
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
      new BN(mngoPerPeriod * Math.pow(10, mngoToken.decimals)),
      new BN(exp),
      new BN(version),
      new BN(lmSizeShift),
      new BN(baseDecimals),
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

      <Form.Item
        name="rate"
        label="initial value for dynamic rate"
        initialValue={0.00001}
        required
      >
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
        name="exp"
        label="order book depth weight exponent"
        initialValue={4}
        required
      >
        <Input type="number" />
      </Form.Item>

      <Form.Item
        name="targetPeriodLength"
        label="Target period length in seconds"
        initialValue={3600}
        required
      >
        <Input type="number" />
      </Form.Item>

      <Form.Item
        name="mngoPerPeriod"
        label="MNGO per period"
        initialValue={0}
        required
      >
        <Input type="number" />
      </Form.Item>
      <Form.Item name="version" label="Version" initialValue={0} required>
        <Input type="number" />
      </Form.Item>
      <Form.Item
        name="lmSizeShift"
        label="x such that maxSizeDepth / 2 ^ x is between 1 and 100"
        initialValue={0}
      >
        <Input type="number" />
      </Form.Item>
      <Form.Item
        name="baseDecimals"
        label="nr of decimals a spot market would be listed with in case it does not exist yet"
        initialValue={9}
      >
        <Input type="number" />
      </Form.Item>
    </Form>
  );
};
