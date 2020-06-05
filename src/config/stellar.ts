import { Networks } from 'stellar-sdk';
import { registerAs } from '@nestjs/config';

export default registerAs('stellar', () => ({
  fundingAmount: 8,
  getSecretForAccount(account: string) {
    return process.env[`STELLAR_SECRET_${account}`];
  },
  networkPassphrase: process.env.STELLAR_NETWORK_PASSPHRASE || Networks.PUBLIC,
  horizonUrls: {
    'Test SDF Network ; September 2015': 'https://horizon-testnet.stellar.org',
    'Public Global Stellar Network ; September 2015': 'https://horizon.stellar.org',
  },
  signingKey: process.env.SEP10_SIGNING_KEY,
  skipFeeEstimation: process.env.STELLAR_SKIP_FEE_ESTIMATION,
}));
