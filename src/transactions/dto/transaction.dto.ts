/* tslint:disable:variable-name */
import { TransactionType } from '../enums/transaction-type.enum';
import { TransactionState } from '../enums/transaction-state.enum';

export class TransactionDto {
  id: string;
  kind: TransactionType;
  status: TransactionState;
  status_eta?: number;
  more_info_url?: string;
  amount_in?: string;
  amount_out?: string;
  amount_fee?: string;
  from?: string;
  to?: string;
  // external_extra?: string;
  // external_extra_text?: string;
  deposit_memo?: string;
  deposit_memo_type?: string;
  withdraw_anchor_account?: string;
  withdraw_memo?: string;
  withdraw_memo_type?: string;
  started_at?: Date;
  completed_at?: Date;
  stellar_transaction_id?: string;
  external_transaction_id?: string;
  message?: string;
  refunded?: boolean;
}
