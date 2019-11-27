# Stellar Anchor

[![CircleCI](https://circleci.com/gh/apay-io/stellar-anchor.svg?style=shield)](https://circleci.com/gh/apay-io/stellar-anchor)

IMPORTANT DISCLAIMER: This code should not be used in production without a thorough security audit.

## How to run the project
Before running the project, follow the following steps to customize your environment.

```
cp .env.example .env
cp assets.json.example assets.json
```

adjust values in `.env` and `assets.json` according to your preferences

```
npm i
npm run build:dev
npm start
```

Run `node bootstrap.js` before `npm start` if you need to create accounts


## Security vulnerability disclosure
Please report suspected security vulnerabilities in private to security@apay.io 

Please do NOT create publicly viewable issues for suspected security vulnerabilities.
