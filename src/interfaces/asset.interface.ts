export enum StatusEnum {
  live = 'live',
  test = 'test',
  dead = 'dead',
  'private' = 'private',
}

export enum AnchorAssetTypeEnum {
  crypto = 'crypto',
  fiat = 'fiat',
  stock = 'stock',
  bond = 'bond',
  commodity = 'commodity',
  realestate = 'realestate',
  other = 'other',
}

export interface AssetInterface {
  code: string; // asset code on Stellar
  driver: {
    code: string; // code of the asset in the wallet
    env?: string; // bitgo environment
    accessToken: string; // environment variable name for bitgo access token, don't store real secrets in this file
    walletId: string; // environment variable name for bitgo wallet id, don't store real secrets in this file
    walletPassphrase: string; // environment variable name for bitgo wallet passphrase, don't store real secrets in this file
  };
  // following settings for stellar.toml
  stellar: {
    code_template?: string
    issuer: string;
    status?: StatusEnum;
    display_decimals?: number;
    name: string;
    desc: string;
    conditions?: string;
    image: string;
    fixed_number?: number;
    max_number?: number;
    is_unlimited?: boolean;
    is_asset_anchored?: boolean;
    anchor_asset_type?: AnchorAssetTypeEnum;
    anchor_asset?: string;
    redemption_instructions?: string;
    collateral_addresses?: string;
    collateral_address_messages?: string;
    collateral_address_signatures?: string;
    regulated?: boolean;
    approval_server?: string;
    approval_criteria?: string;
  };
  horizonUrl: string; // settings that define stellar network (for supporting live + testnet assets at the same time)
  networkPassphrase: string;
  channels: string[]; // channel accounts for parallel processing, using just 1 atm, can be the same as distributor
  distributor: string; // distributor account for the asset, can be the same as issuer
  // following settings for sep6 deposit/withdrawals: limits and fees
  deposit: {
    min?: number;
    max?: number;
    fee_fixed?: number;
    fee_percent?: number;
    fee_create?: number;
    eta?: number;
  };
  withdrawal: {
    min?: number;
    max?: number;
    fee_fixed?: number;
    fee_percent?: number;
    eta?: number;
  };
  withdrawalBatching: number; // how many milliseconds group together for withdrawal, value 60000 is 1 min
  totalSupply: string; // total asset supply on stellar (no easy way to calculate automatically)
  excludedSupply?: string[]; // exclude some accounts from circulating supply calculation, leave empty if you don't know what it is
}
