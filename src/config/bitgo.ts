export default {
  env: process.env.BITGO_ENV || 'test',
  accessToken: process.env.BITGO_ACCESS_TOKEN,
  walletIds: {
    tbtc: process.env.BITGO_TBTC_WALLET_ID,
  },
};
