import { providers } from "near-api-js";

import {
  EventEmitterService,
  LoggerService,
  ProviderService,
  JsonStorageService,
} from "../services";
import { Options } from "../options.types";
import { Transaction, Action } from "./transactions.types";
import { Modify, Optional } from "../utils.types";

interface BaseWalletMetadata {
  name: string;
  description: string | null;
  iconUrl: string;
}

export interface Account {
  accountId: string;
}

export interface ConnectParams {
  contractId: string;
  methodNames?: Array<string>;
}

export interface SignAndSendTransactionParams {
  signerId?: string;
  receiverId?: string;
  actions: Array<Action>;
}

export interface SignAndSendTransactionsParams {
  transactions: Array<Optional<Transaction, "signerId">>;
}

interface BaseWalletBehaviour {
  connect(params: ConnectParams): Promise<Array<Account>>;
  disconnect(): Promise<void>;
  getAccounts(): Promise<Array<Account>>;
  signAndSendTransaction(
    params: SignAndSendTransactionParams
  ): Promise<providers.FinalExecutionOutcome>;
  signAndSendTransactions(
    params: SignAndSendTransactionsParams
  ): Promise<Array<providers.FinalExecutionOutcome>>;
}

type BaseWallet<
  Type extends string,
  Metadata extends BaseWalletMetadata,
  Behaviour
> = {
  id: string;
  type: Type;
  metadata: Metadata;
} & Behaviour;

export type WalletEvents = {
  connected: {
    contractId: string;
    methodNames: Array<string>;
    accounts: Array<Account>;
  };
  disconnected: null;
  accountsChanged: { accounts: Array<Account> };
  networkChanged: { networkId: string };
};

// ----- Browser Wallet ----- //

export type BrowserWalletMetadata = BaseWalletMetadata;

export interface BrowserWalletSignAndSendTransactionParams
  extends SignAndSendTransactionParams {
  callbackUrl?: string;
}

export interface BrowserWalletSignAndSendTransactionsParams
  extends SignAndSendTransactionsParams {
  callbackUrl?: string;
}

export type BrowserWalletBehaviour = Modify<
  BaseWalletBehaviour,
  {
    signAndSendTransaction(
      params: BrowserWalletSignAndSendTransactionParams
    ): Promise<void>;
    signAndSendTransactions(
      params: BrowserWalletSignAndSendTransactionsParams
    ): Promise<void>;
  }
>;

export type BrowserWallet = BaseWallet<
  "browser",
  BrowserWalletMetadata,
  BrowserWalletBehaviour
>;

// ----- Injected Wallet ----- //

export type InjectedWalletMetadata = BaseWalletMetadata & {
  downloadUrl: string;
};

export type InjectedWalletBehaviour = BaseWalletBehaviour;

export type InjectedWallet = BaseWallet<
  "injected",
  InjectedWalletMetadata,
  InjectedWalletBehaviour
>;

// ----- Hardware Wallet ----- //

export type HardwareWalletMetadata = BaseWalletMetadata;

export interface HardwareWalletConnectParams extends ConnectParams {
  derivationPaths: Array<string>;
}

export type HardwareWalletBehaviour = Modify<
  BaseWalletBehaviour,
  { connect(params: HardwareWalletConnectParams): Promise<Array<Account>> }
>;

export type HardwareWallet = BaseWallet<
  "hardware",
  HardwareWalletMetadata,
  HardwareWalletBehaviour
>;

// ----- Bridge Wallet ----- //

export type BridgeWalletMetadata = BaseWalletMetadata;

export type BridgeWalletBehaviour = BaseWalletBehaviour;

export type BridgeWallet = BaseWallet<
  "bridge",
  BridgeWalletMetadata,
  BridgeWalletBehaviour
>;

// ----- Misc ----- //

export type WalletMetadata =
  | BrowserWalletMetadata
  | InjectedWalletMetadata
  | HardwareWalletMetadata
  | BridgeWalletMetadata;

export type Wallet =
  | BrowserWallet
  | InjectedWallet
  | HardwareWallet
  | BridgeWallet;

export type WalletType = Wallet["type"];

export interface WalletBehaviourOptions<Variation extends Wallet> {
  id: Variation["id"];
  type: Variation["type"];
  metadata: Variation["metadata"];
  options: Options;
  provider: ProviderService;
  emitter: EventEmitterService<WalletEvents>;
  logger: LoggerService;
  storage: JsonStorageService;
}

// Note: TypeScript doesn't seem to like reusing this in WalletModule.
export type WalletBehaviourFactory<
  Variation extends Wallet,
  ExtraOptions extends object = object
> = (
  options: WalletBehaviourOptions<Variation> & ExtraOptions
) => Promise<Omit<Variation, "id" | "type" | "metadata">>;

export type WalletModule<Variation extends Wallet = Wallet> = {
  id: Variation["id"];
  type: Variation["type"];
  metadata: Variation["metadata"];
  init(
    options: WalletBehaviourOptions<Variation>
  ): Promise<Omit<Variation, "id" | "type" | "metadata">>;
};

export type WalletModuleFactory<Variation extends Wallet = Wallet> =
  () => Promise<WalletModule<Variation> | null>;
