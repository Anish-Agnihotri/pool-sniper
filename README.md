# pool-sniper

Allows sniping pool creation events for [Uniswap V2](https://uniswap.org/blog/uniswap-v2/)-styled routers in under 250 LOC. Monitors `UniswapV2Factory` for `PairCreated` events, verifies that one of the tokens of pair matches your desired sniping tokens, and automatically submits a purchase transaction (with initial token for route === base chain token, eg. ETH or Matic).

This repo is a proof-of-concept implementation of sniping the [Klima](https://klimadao.finance/) pool launch on [Sushiswap Router V2 — Polygon](https://polygonscan.com/address/0x1b02da8cb0d097eb8d57a175b88c7d8b47997506). If you do not want to test on Polygon Mainnet, **do not apply the postinstall patch and change src/sniper.ts:L73 to desired network**.

Credits: [@joshstevens19](https://github.com/joshstevens19) for [simple-uniswap-sdk](https://github.com/uniswap-integration/simple-uniswap-sdk)

## Usage

```bash
# Clone repo
git clone https://github.com/anish-agnihotri/pool-sniper

# Install dependencies (and apply postinstall script)
npm install

# Update environment variables
cp .env.sample > .env
vim .env

# Run pool-sniper
npm run start
```

## Local testing

The Polygon patch is automatically applied `postinstall`. You can remove this and update `src/sniper.ts:L73` to test against a testnet.

The easiest way to test locally is:

1. Deploy a new ERC20 and mint yourself some tokens:

```solidity
// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol"; // OZ: ERC20

contract Tester is ERC20 {
    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {
        _mint(msg.sender, 1e18 * 1000);
    }
}
```

2. Copy the deployed address and add to `.env`
3. Run the sniper (`npm run start`)
4. Create a new UniswapV2-styled pool with deployed ERC20 and base chain asset (eg. ETH/Matic) and watch your sniper pick up the new pool creation

## License

Unlicense
