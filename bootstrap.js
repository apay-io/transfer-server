const axios = require('axios');
const dotenv = require('dotenv').config();
const fs = require('fs');
const StellarSdk = require('stellar-sdk');

const bootstrap = async () => {
  const assets = JSON.parse(fs.readFileSync('./assets.json'));
  let issuerKeypair, distKeypair, channelKeypair;
  for (const asset of assets) {
    const server = new StellarSdk.Server(asset.horizonUrl);
    if (!asset.stellar.issuer) {
      issuerKeypair = StellarSdk.Keypair.random();
      asset.stellar.issuer = issuerKeypair.publicKey();
      fs.appendFileSync('./.env', `STELLAR_SECRET_${issuerKeypair.publicKey()}=${issuerKeypair.secret()}\n`)
    } else {
      issuerKeypair = StellarSdk.Keypair.fromSecret(process.env[`STELLAR_SECRET_${asset.stellar.issuer}`]);
    }
    if (!asset.distributor) {
      distKeypair = StellarSdk.Keypair.random();
      asset.distributor = distKeypair.publicKey();
      fs.appendFileSync('./.env', `STELLAR_SECRET_${distKeypair.publicKey()}=${distKeypair.secret()}\n`)
    } else {
      distKeypair = StellarSdk.Keypair.fromSecret(process.env[`STELLAR_SECRET_${asset.distributor}`]);
    }
    if (!asset.channels || asset.channels.length === 0) {
      channelKeypair = StellarSdk.Keypair.random();
      asset.channels = [channelKeypair.publicKey()];
      fs.appendFileSync('./.env', `STELLAR_SECRET_${channelKeypair.publicKey()}=${channelKeypair.secret()}\n`)
    } else {
      channelKeypair = StellarSdk.Keypair.fromSecret(process.env[`STELLAR_SECRET_${asset.channels[0]}`]);
    }
    try {
      await axios.get(`https://friendbot.stellar.org/?addr=${asset.stellar.issuer}`);
      await axios.get(`https://friendbot.stellar.org/?addr=${asset.distributor}`);
      for (const channel of asset.channels) {
        await axios.get(`https://friendbot.stellar.org/?addr=${channel}`);
      }
    } catch(err) {
      // ignore
    }

    console.log(asset);
    try {
      const distributor = await server.loadAccount(asset.distributor);
      const txBuilder = new StellarSdk.TransactionBuilder(distributor, {
        networkPassphrase: asset.networkPassphrase,
        fee: 100,
      });
      txBuilder.setTimeout(180);
      txBuilder.addOperation(StellarSdk.Operation.changeTrust({
        asset: new StellarSdk.Asset(asset.code, asset.stellar.issuer),
        source: asset.distributor
      }));
      txBuilder.addOperation(StellarSdk.Operation.payment({
        destination: asset.distributor,
        asset: new StellarSdk.Asset(asset.code, asset.stellar.issuer),
        amount: '1000',
        source: asset.stellar.issuer
      }));
      const tx = txBuilder.build();
      tx.sign(issuerKeypair, distKeypair);
      console.log(await server.submitTransaction(tx));
    } catch (err) {
      console.log(err.response.data);
    }
  }
  fs.writeFileSync('./assets.json', JSON.stringify(assets, null, 4));
};

if (process.env.NODE_ENV !== 'production') {
  bootstrap();
} else {
  console.log('THIS IS NOT MEANT FOR production!');
}
