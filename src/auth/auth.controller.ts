import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { StellarService } from '../wallets/stellar.service';
import { Utils, Keypair } from 'stellar-sdk';
import { ChallengeRequest } from './dto/challenge-request.dto';
import { TokenRequest } from './dto/token-request.dto';
import { ConfigService } from '@nestjs/config';

interface ChallengeResponse {
  transaction: string;
  network_passphrase?: string;
}

interface TokenResponse {
  token: string;
}

@Controller('/auth')
export class AuthController {
  constructor(
    private readonly config: ConfigService,
    private readonly stellarService: StellarService,
    private readonly jwtService: JwtService,
  ) {
  }

  @Get()
  async challenge(@Query() challengeRequest: ChallengeRequest): Promise<ChallengeResponse> {
    const networkPassphrase = this.config.get('stellar').networkPassphrase;
    const signingKey = this.config.get('stellar').signingKey;
    return {
      transaction: Utils.buildChallengeTx(
        Keypair.fromSecret(this.config.get('stellar').getSecretForAccount(signingKey)),
        challengeRequest.account,
        this.config.get('app').appName,
        300,
        networkPassphrase
      ),
      network_passphrase: networkPassphrase,
    };
  }

  @Post()
  async token(@Body() dto: TokenRequest): Promise<TokenResponse> {
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
        try {
          Utils.verifyChallengeTxSigners(
            dto.transaction,
            signingKey,
            networkPassphrase,
            [clientAccountID]
          );
        } catch (error) {
          throw new BadRequestException({
            error: error.message
          });
        }
      } else {
        throw new BadRequestException({
          error: err.message
        });
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
