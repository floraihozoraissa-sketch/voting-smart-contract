# Smart Contract Development & Deployment Master Guide

---

## 1. Project Overview

This master guide serves as a comprehensive, production-ready reference manual for designing, developing, testing, securing, deploying, and verifying smart contracts on EVM-compatible blockchains (such as Ethereum and testnets like Sepolia).

It covers two primary toolchains:

* **Hardhat (TypeScript / ESM):** A JavaScript/TypeScript-based environment ideal for developers who prefer leveraging web3 toolchains, testing in Mocha/Chai, and using modular Node.js plugins.
* **Foundry (Solidity):** A blazing-fast, Rust-based toolkit written entirely in Solidity, enabling native Solidity-based testing, advanced fuzz testing, and integrated deployment/verification commands.

---

## 2. How to Initialize a Project

### Initializing Hardhat

1. Create and enter your project workspace:
```bash
mkdir voting-dapp
cd voting-dapp
npm init -y

```


2. Install Hardhat and core toolchain dependencies:
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox-mocha-ethers @nomicfoundation/hardhat-verify dotenv

```


3. Initialize the Hardhat configuration framework:
```bash
npx hardhat init

```


*(Select your preferred TypeScript/ESM configuration profiles).*

### Initializing Foundry

1. Ensure Foundry is installed (`foundryup`), then create and initialize your workspace:
```bash
mkdir voting-foundry
cd voting-foundry
forge init

```


This automatically generates the standard directory tree and installs `forge-std`.

---

## 3. Complete Folder Structure Breakdown

### Hardhat (TypeScript / ESM) Folder Structure

When a modern Hardhat project is initialized and compiled, it produces a specific set of configuration, source, and generated files:

```text
voting-dapp/
├── artifacts/
│   └── contracts/
│       └── Voting.sol/
│           ├── Voting.json        # Compiled ABI and bytecode artifact for frontend integration
│           └── Voting.dbg.json    # Debugging metadata for the compiled artifact
├── cache/
│   └── solidity-files-cache.json  # Internal build cache used by Hardhat to skip unchanged files
├── contracts/
│   └── Voting.sol                 # Solidity smart contract source code files
├── node_modules/                  # Local Node.js package dependencies and plugins
├── scripts/
│   └── deploy.ts                  # TypeScript deployment scripts executed via hardhat run
├── test/
│   └── Voting.ts                  # Unit test suite written in TypeScript using Mocha and Chai
├── .env / keystore files          # Encrypted local keystores or environment variable configs
├── .gitignore                     # Specifies untracked files ignored by Git (node_modules, cache, artifacts, .keystore)
├── hardhat.config.ts              # Core configuration file defining networks, solidity versions, plugins, and verification parameters
├── package.json                   # Project manifest tracking dependencies, scripts, and module type ("type": "module")
└── tsconfig.json                  # TypeScript compiler options and type-checking rules

```

#### Detailed Breakdown of Hardhat Files:

* **`hardhat.config.ts`**: The configuration hub. Configures compiler settings (optimizer runs, Solidity versions), network RPC endpoints, and plugin registrations (verify, toolbox).
* **`package.json`**: Tracks third-party dependencies (`ethers`, `hardhat`, `dotenv`), execution scripts, and defines whether the project runs under CommonJS or ES Modules (`"type": "module"`).
* **`tsconfig.json`**: Governs TypeScript compilation rules, target JavaScript versions, module resolution, and strict type-checking flags.
* **`contracts/`**: The workspace directory containing all user-written `.sol` smart contract files.
* **`scripts/`**: Houses deployment and maintenance scripts that interact with the network provider to deploy contracts and initialize state.
* **`test/`**: Contains testing files written with TypeScript, utilizing testing assertions (`chai`) and runtime environments (`ethers`) to validate contract logic.
* **`artifacts/`** *(Auto-generated)*: Created during compilation (`npx hardhat compile`), storing ABIs and bytecode required for frontend integration.
* **`cache/`** *(Auto-generated)*: Stores compiler state data to optimize re-compilation times.
* **`.gitignore`**: Excludes sensitive credentials, build outputs (`artifacts/`, `cache/`), and package folders (`node_modules/`) from repository commits.

---

### Foundry Folder Structure

Foundry organizes projects natively around Solidity code without requiring Node.js configuration files for core execution:

```text
voting-foundry/
├── lib/
│   └── forge-std/                 # Standard testing library and cheatcode definitions for Foundry
├── script/
│   └── DeployVoting.s.sol         # Solidity deployment scripts leveraging vm.startBroadcast()
├── src/
│   └── Voting.sol                 # Core Solidity smart contract source files
├── test/
│   └── Voting.t.sol               # Solidity-native unit test contracts inheriting from Test
├── .gitmodules                    # Git submodules tracker managing external library repositories in lib/
├── foundry.toml                   # Foundry project configuration file (optimizer, rpc endpoints, gas reports)
├── remappings.txt                 # Path remappings directing import aliases (e.g., @openzeppelin/ to lib/)
└── README.md                      # Project documentation template

```

#### Detailed Breakdown of Foundry Files:

* **`foundry.toml`**: The core configuration file for Foundry. Controls compiler optimization runs, EVM target versions, RPC endpoints, and gas reporting thresholds.
* **`src/`**: The home for all production smart contract source files (`.sol`).
* **`script/`**: Contains deployment scripts written in pure Solidity (`.s.sol`), executed transactionally via Forge cheatcodes.
* **`test/`**: Houses Solidity test suites (`.t.sol`). Tests are smart contracts themselves that inherit from `forge-std/Test.sol` and utilize cheatcodes (`vm.prank`, `vm.warp`).
* **`lib/`**: Directory where external dependencies (such as OpenZeppelin contracts or `forge-std`) are installed and managed as git submodules.
* **`remappings.txt`**: Maps short import paths (e.g., `@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/`) so the compiler can resolve library imports correctly.
* **`.gitmodules`**: Tracks external GitHub repositories linked inside the `lib/` directory.
* **`README.md`**: Standard Markdown file documenting the repository structure, build instructions, and testing commands.

---

## 4. Secure Key Management

Never store private keys in plaintext code files or commit `.env` files to version control.

* **Hardhat Keystore:**
```bash
npx hardhat keystore set SEPOLIA_RPC_URL
npx hardhat keystore set PRIVATE_KEY
npx hardhat keystore set ETHERSCAN_API_KEY

```


* **Foundry Keystore (`cast`):**
```bash
cast wallet import my-deployer-key --interactive

```



---

## 5. Writing and Running Unit Tests

* **Hardhat Test Execution:**
```bash
npx hardhat test

```


* **Foundry Test Execution:**
```bash
forge test -vvv

```



---

## 6. Deployment Workflow

* **Hardhat Deployment:**
Ensure your deployment script (`scripts/deploy.ts`) uses Hardhat 3 network connection patterns, then run:
```bash
npx hardhat run scripts/deploy.ts --network sepolia

```


* **Foundry Deployment & Verification (Single Command):**
```bash
forge script script/DeployVoting.s.sol:DeployVoting \
  --rpc-url $SEPOLIA_RPC_URL \
  --account my-deployer-key \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY

```



---

## 7. Block Explorer Verification

* **Hardhat Verification:**
Create an `arguments.js` file for complex constructor parameters:
```javascript
export default [
  ["Alice", "Bob", "Charlie"]
];

```


Run the verification command:
```bash
npx hardhat verify --network sepolia --constructor-args-path arguments.js <CONTRACT_ADDRESS>

```


* **Foundry Manual Verification:**
```bash
cast abi-encode "constructor(string[])" "[\"Alice\", \"Bob\", \"Charlie\"]"
forge verify-contract \
  --chain sepolia \
  --constructor-args <ENCODED_HEX_STRING> \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  <CONTRACT_ADDRESS> \
  src/Voting.sol:Voting

```