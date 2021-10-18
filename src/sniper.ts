import {
  UniswapPair,
  UniswapVersion,
  ETH,
  UniswapPairSettings,
  TradeDirection
} from "simple-uniswap-sdk"; // Simple Uniswap Trades
import { logger } from "./utils/logging"; // Logging
import { ABI_UniswapV2Factory } from "./utils/constants"; // ABIs
import { providers, Wallet, utils, BigNumber, Contract } from "ethers"; // Ethers

export default class Sniper {
  // Ethers provider
  rpc: providers.JsonRpcProvider;
  // Sniping wallet
  wallet: Wallet;

  // Token to watch
  tokenAddress: string;
  // Factory contract
  factory: Contract;
  // Amount of base token (ETH/Matic) to spend
  purchaseAmount: string;
  // Maximum gas price to pay for tx inclusion
  gasPrice: BigNumber;
  // Max trade slippage
  slippage: number;

  /**
   * Updates token and purchase details + sets up RPC
   * @param {string} tokenAddress of token to purchase
   * @param {string} factoryAddress of Uniswap V2 Factory
   * @param {string} rpcEndpoint for network
   * @param {string} privateKey of purchasing wallet
   * @param {string} purchaseAmount to swap with (input)
   * @param {string} gasPrice to pay
   * @param {number} slippage for trade execution
   */
  constructor(
    tokenAddress: string,
    factoryAddress: string,
    rpcEndpoint: string,
    privateKey: string,
    purchaseAmount: string,
    gasPrice: string,
    slippage: number
  ) {
    // Setup networking + wallet
    this.rpc = new providers.JsonRpcProvider(rpcEndpoint);
    this.wallet = new Wallet(privateKey, this.rpc);

    // Setup token details
    this.tokenAddress = utils.getAddress(tokenAddress); // Normalize address
    this.factory = new Contract(factoryAddress, ABI_UniswapV2Factory, this.rpc);
    this.purchaseAmount = purchaseAmount;
    this.gasPrice = utils.parseUnits(gasPrice, "gwei");
    this.slippage = slippage;
  }

  /**
   * Generates and submits purchase transaction for desired token w/ base pair
   * @param {string} token0 address of token0 in pair
   * @param {string} token1 address of token1 in pair
   */
  async submitPurchaseTx(token0: string, token1: string): Promise<void> {
    // Setup token address
    const desiredIsFirst: boolean = token0 === this.tokenAddress;
    const desiredTokenAddress: string = desiredIsFirst ? token0 : token1;

    // Generate Uniswap pair
    const pair = new UniswapPair({
      // Base chain token to convert from
      fromTokenContractAddress: ETH.POLYGON().contractAddress,
      // Desired token to purchase
      toTokenContractAddress: desiredTokenAddress,
      // Ethereum address of user
      ethereumAddress: this.wallet.address,
      ethereumProvider: this.rpc,
      settings: new UniswapPairSettings({
        slippage: this.slippage, // Slippage config
        deadlineMinutes: 5, // 5m max execution deadline
        disableMultihops: false, // Allow multihops
        uniswapVersions: [UniswapVersion.v2] // Only V2
      })
    });

    // Create pair factory
    const uniswapPairFactory = await pair.createFactory();
    // Generate trade
    const trade = await uniswapPairFactory.trade(
      this.purchaseAmount,
      TradeDirection.input
    );

    // Update trade gas price
    let tx: any = trade.transaction;
    tx.gasPrice = this.gasPrice;

    // Send and log trade
    const tradeTx = await this.wallet.sendTransaction(tx);
    logger.info(`Transaction sent: ${tradeTx.hash}`);
  }

  /**
   * Listen for pool creation and submit purchase tx
   */
  async snipe(): Promise<void> {
    logger.info("Beginning to monitor UniswapV2Factory");

    // Listen for pair creation
    this.factory.on("PairCreated", async (token0: string, token1: string) => {
      // Log new created pairs
      logger.info(`New pair: ${token0}, ${token1}`);

      // If new pair contains desired token
      if ([token0, token1].includes(this.tokenAddress)) {
        // Submit purchase transaction
        logger.info("Desired token found in pair.");
        await this.submitPurchaseTx(token0, token1);

        // Exit process after submitting tx (no PGA)
        process.exit(0);
      }
    });
  }
}
