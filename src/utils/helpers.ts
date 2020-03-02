import { BigNumber } from 'bignumber.js';

export default {
  eq: (arg1, arg2) => arg1 === arg2,
  formatTx: (type, asset, direction, hash) => {
    const links = {
      TBTC: `https://blockstream.info/testnet/tx/${hash}`,
      TXLM: `https://stellar.expert/explorer/testnet/tx/${hash}`,
    };
    return hash
      ? `<a target="_blank" href="` +
      (type === 'deposit' && direction === 'in' || type === 'withdrawal' && direction === 'out'
        ? links[asset]
        : links.TXLM) + `">${hash.slice(0, 5)}...${hash.slice(-5)}</a>`
      : null;
  },
  formatAddress: (type, asset, direction, address) => {
    const links = {
      TBTC: `https://blockstream.info/testnet/address/${address}`,
      TXLM: `https://stellar.expert/explorer/testnet/account/${address}`,
    };
    return address
      ? `<a target="_blank" href="` +
      (type === 'deposit' && direction === 'in' || type === 'withdrawal' && direction === 'out'
        ? links[asset]
        : links.TXLM) + `">${address.slice(0, 5)}...${address.slice(-5)}</a>`
      : null;
  },
  formatDate: (dateTime: Date) => {
    const now = new Date();
    const secondsAgo = Math.round((now.getTime() - dateTime.getTime()) / 1000);
    const minutesAgo = secondsAgo > 60 ? Math.round(secondsAgo / 60) + ' minutes ago' : null;
    const hoursAgo = secondsAgo > 3600 ? Math.round(secondsAgo / 3600) + ' hours ago' : null;
    const daysAgo = secondsAgo > 86400 ? Math.round(secondsAgo / 86400) + ' days ago' : null;
    return `${dateTime.toString().slice(4, 15)}<br>${dateTime.toString().slice(16, 24)}<br>${daysAgo || hoursAgo || minutesAgo || (secondsAgo + ' seconds ago')}`;
  },
  formatAmount: (amount: BigNumber) => {
    return amount.toFixed(7).replace(/\.?0+$/, '');
  },
};
