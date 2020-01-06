export default {
  fundingAmount: 8,
  getSecretForAccount(account: string) {
    return process.env[`STELLAR_SECRET_${account}`];
  },
};
