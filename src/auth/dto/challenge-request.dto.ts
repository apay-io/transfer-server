import { IsStellarAccount } from '../../validators/stellar-account.validator';

export class ChallengeRequest {
  @IsStellarAccount()
  readonly account: string;
}
