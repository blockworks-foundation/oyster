import { FormInstance } from 'antd';
import React from 'react';
import { ParsedAccount } from '@oyster/common';
import { Governance, Realm } from '../../../../models/accounts';
import { GovernanceConfigForm } from './governanceConfigForm';
import { InstructionType } from './instructionSelector';
import { TransactionInstruction } from '@solana/web3.js';
import { RealmConfigForm } from './realmConfigForm';
import { MangoAddSpotMarketForm } from './mangoAddSpotMarketForm';
import { MangoAddOracleForm } from './mangoAddOracleForm';

export function getGovernanceInstructions(
  realm: ParsedAccount<Realm>,
  governance: ParsedAccount<Governance>,
) {
  let instructions = [InstructionType.GovernanceSetConfig];

  if (governance.pubkey.toBase58() === realm.info.authority?.toBase58()) {
    instructions.push(InstructionType.GovernanceSetRealmConfig);
  }

  if (
    governance.info.governedAccount.toBase58() ===
    '5fP7Z7a87ZEVsKr2tQPApdtq83GcTW4kz919R6ou5h5E'
  ) {
    instructions.push(InstructionType.MangoAddOracle);
    instructions.push(InstructionType.MangoAddSpotMarket);
  }

  return instructions;
}

export function GovernanceInstructionForm({
  form,
  instruction,
  realm,
  governance,
  onCreateInstruction,
}: {
  form: FormInstance;
  instruction: InstructionType;
  realm: ParsedAccount<Realm>;
  governance: ParsedAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) {
  return (
    <>
      {instruction === InstructionType.GovernanceSetConfig && (
        <GovernanceConfigForm
          form={form}
          governance={governance}
          onCreateInstruction={onCreateInstruction}
        ></GovernanceConfigForm>
      )}
      {instruction === InstructionType.GovernanceSetRealmConfig && (
        <RealmConfigForm
          form={form}
          realm={realm}
          governance={governance}
          onCreateInstruction={onCreateInstruction}
        ></RealmConfigForm>
      )}
      {instruction === InstructionType.MangoAddOracle && (
        <MangoAddOracleForm
          form={form}
          governance={governance}
          onCreateInstruction={onCreateInstruction}
        ></MangoAddOracleForm>
      )}
      {instruction === InstructionType.MangoAddSpotMarket && (
        <MangoAddSpotMarketForm
          form={form}
          governance={governance}
          onCreateInstruction={onCreateInstruction}
        ></MangoAddSpotMarketForm>
      )}
    </>
  );
}
