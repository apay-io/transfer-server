export enum TransactionState {
  incomplete = 'incomplete',
  pending_user_transfer_start = 'pending_user_transfer_start',
  pending_external = 'pending_external',
  pending_stellar = 'pending_stellar',
  pending_user = 'pending_user',
  pending_trust = 'pending_trust',
  pending_anchor = 'pending_anchor',
  completed = 'completed',
  no_market = 'no_market',
  too_small = 'too_small',
  too_large = 'too_large',
  error = 'error',
}
