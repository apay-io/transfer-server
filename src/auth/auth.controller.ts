import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ConfigService, InjectConfig } from 'nestjs-config';
import { JwtService } from '@nestjs/jwt';
import { StellarService } from '../wallets/stellar.service';
import { Utils, Keypair } from 'stellar-sdk';

interface Sep10ChallengeResponse {
  transaction: string;
  network_passphrase?: string;
}

interface Sep10TokenResponse {
  token: string;
}

@Controller('/auth')
export class AuthController {
  constructor(
    @InjectConfig()
    private readonly config: ConfigService,
    private readonly stellarService: StellarService,
    private readonly jwtService: JwtService,
  ) {
  }

  @Get()
  async challenge(@Query('account') userAccount: string): Promise<Sep10ChallengeResponse> {
    const networkPassphrase = this.config.get('stellar').networkPassphrase;
    const signingKey = this.config.get('stellar').signingKey;
    return {
      transaction: Utils.buildChallengeTx(
        Keypair.fromSecret(this.config.get('stellar').getSecretForAccount(signingKey)),
        userAccount,
        this.config.get('app').appName,
        300,
        networkPassphrase
      ),
      network_passphrase: networkPassphrase,
    };
  }

  @Post()
  async token(@Body() dto: { transaction: string }): Promise<Sep10TokenResponse> {
    const networkPassphrase = this.config.get('stellar').networkPassphrase;
    const signingKey = this.config.get('stellar').signingKey;
    const { clientAccountID } = Utils.readChallengeTx(dto.transaction, signingKey, networkPassphrase);
    try {
      const userAccount = await this.stellarService.getServer(networkPassphrase).loadAccount(clientAccountID);
      Utils.verifyChallengeTxThreshold(
        dto.transaction,
        signingKey,
        networkPassphrase,
        userAccount.thresholds.med_threshold,
        userAccount.signers
      );
    } catch (err) {
      if (err.name === 'NotFoundError') {
        Utils.verifyChallengeTxSigners(
          dto.transaction,
          signingKey,
          networkPassphrase,
          [clientAccountID]
        );
      } else {
        throw err;
      }
    }
    const payload = {
      sub: clientAccountID,
    };
    return {
      token: this.jwtService.sign(payload),
    };
  }
}
