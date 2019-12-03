/// <reference types="node" />
/**
 * @prettier
 */
import * as Bluebird from 'bluebird';
import { BitGo } from '../../bitgo';
import { BaseCoin, TransactionExplanation as BaseTransactionExplanation, KeyPair, ParseTransactionOptions, ParsedTransaction, VerifyAddressOptions, VerifyTransactionOptions, SignedTransaction } from '../baseCoin';
import { NodeCallback } from '../types';
export interface TransactionExplanation extends BaseTransactionExplanation {
    memo: string;
}
export interface SignTransactionOptions {
    txPrebuild: TransactionPrebuild;
    prv: string;
}
export interface TransactionPrebuild {
    txHex: string;
    halfSigned?: {
        txHex: string;
    };
    txInfo: {
        from: string;
        to: string;
        amount: string;
        fee: number;
        firstRound: number;
        lastRound: number;
        genesisID: string;
        genesisHash: string;
        note?: string;
    };
    keys: string[];
    addressVersion: number;
}
export interface FullySignedTransaction {
    txHex: string;
}
export interface HalfSignedTransaction {
    halfSigned: {
        txHex: string;
    };
}
export interface ExplainTransactionOptions {
    txHex?: string;
    halfSigned?: {
        txHex: string;
    };
}
export interface VerifiedTransactionParameters {
    txHex: string;
    addressVersion: number;
    keys: string[];
    sk: string;
    isHalfSigned: boolean;
}
export declare class Algo extends BaseCoin {
    constructor(bitgo: BitGo);
    static createInstance(bitgo: BitGo): BaseCoin;
    getChain(): string;
    getFamily(): string;
    getFullName(): string;
    getBaseFactor(): any;
    /**
     * Flag for sending value of 0
     * @returns {boolean} True if okay to send 0 value, false otherwise
     */
    valuelessTransferAllowed(): boolean;
    /**
     * Generate ed25519 key pair
     *
     * @param seed
     * @returns {Object} object with generated pub, prv
     */
    generateKeyPair(seed?: Buffer): KeyPair;
    /**
     * Return boolean indicating whether input is valid public key for the coin.
     *
     * @param {String} pub the pub to be checked
     * @returns {Boolean} is it valid?
     */
    isValidPub(pub: string): boolean;
    /**
     * Return boolean indicating whether input is valid seed for the coin
     * In Algorand, when the private key is encoded as base32 string only the first 32 bytes are taken,
     * so the encoded value is actually the seed
     *
     * @param {String} prv the prv to be checked
     * @returns {Boolean} is it valid?
     */
    isValidPrv(prv: string): boolean;
    /**
     * Return boolean indicating whether input is valid public key for the coin
     *
     * @param {String} address the pub to be checked
     * @returns {Boolean} is it valid?
     */
    isValidAddress(address: string): boolean;
    /**
     * Sign message with private key
     *
     * @param key
     * @param message
     */
    signMessage(key: KeyPair, message: string | Buffer): Buffer;
    /**
     * Specifies what key we will need for signing` - Algorand needs the backup, bitgo pubs.
     */
    keyIdsForSigning(): number[];
    /**
     * Explain/parse transaction
     * @param params
     * @param callback
     */
    explainTransaction(params: ExplainTransactionOptions, callback?: NodeCallback<TransactionExplanation>): Bluebird<TransactionExplanation>;
    isStellarSeed(seed: string): boolean;
    convertFromStellarSeed(seed: string): string | null;
    verifySignTransactionParams(params: SignTransactionOptions): VerifiedTransactionParameters;
    /**
     * Assemble keychain and half-sign prebuilt transaction
     *
     * @param params
     * @param params.txPrebuild {Object} prebuild object returned by platform
     * @param params.prv {String} user prv
     * @param params.wallet.addressVersion {String} this is the version of the Algorand multisig address generation format
     */
    signTransaction(params: SignTransactionOptions): SignedTransaction;
    parseTransaction(params: ParseTransactionOptions, callback?: NodeCallback<ParsedTransaction>): Bluebird<ParsedTransaction>;
    verifyAddress(params: VerifyAddressOptions): boolean;
    verifyTransaction(params: VerifyTransactionOptions, callback?: NodeCallback<boolean>): Bluebird<boolean>;
}
//# sourceMappingURL=algo.d.ts.map
