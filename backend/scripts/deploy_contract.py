"""
scripts/deploy_contract.py
──────────────────────────
Deploy CredentialRegistry.sol to Sepolia and print the contract address.

Requirements:
  pip install web3 eth-account py-solc-x

Usage:
  python scripts/deploy_contract.py

Set these in your .env before running:
  BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/<key>
  BLOCKCHAIN_PRIVATE_KEY=0x...
  BLOCKCHAIN_WALLET_ADDRESS=0x...
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

RPC_URL = os.environ["BLOCKCHAIN_RPC_URL"]
PRIVATE_KEY = os.environ["BLOCKCHAIN_PRIVATE_KEY"]
WALLET_ADDRESS = os.environ["BLOCKCHAIN_WALLET_ADDRESS"]

# Path to contract source (relative to project root)
CONTRACT_PATH = Path(__file__).resolve().parent.parent / "CredentialRegistry.sol"


def main():
    try:
        from web3 import Web3
        from eth_account import Account
        from solcx import compile_source, install_solc
    except ImportError:
        print("Install deps first:  pip install web3 eth-account py-solc-x")
        sys.exit(1)

    # Install solc compiler
    install_solc("0.8.20")

    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    assert w3.is_connected(), f"Cannot connect to {RPC_URL}"
    print(f"Connected to Sepolia (chain id: {w3.eth.chain_id})")

    source = CONTRACT_PATH.read_text()
    compiled = compile_source(
        source,
        output_values=["abi", "bin"],
        solc_version="0.8.20",
    )
    # The key looks like '<stdin>:CredentialRegistry'
    contract_id = next(k for k in compiled if "CredentialRegistry" in k)
    abi = compiled[contract_id]["abi"]
    bytecode = compiled[contract_id]["bin"]

    account = Account.from_key(PRIVATE_KEY)
    Contract = w3.eth.contract(abi=abi, bytecode=bytecode)

    nonce = w3.eth.get_transaction_count(account.address)
    tx = Contract.constructor().build_transaction({
        "from": account.address,
        "nonce": nonce,
        "gasPrice": w3.eth.gas_price,
        "gas": 1_000_000,
    })

    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    print(f"Deploying… tx hash: {tx_hash.hex()}")

    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=180)
    print(f"\n✅ Contract deployed!")
    print(f"   Address : {receipt.contractAddress}")
    print(f"   Block   : {receipt.blockNumber}")
    print(f"\nAdd to your .env:")
    print(f"   BLOCKCHAIN_CONTRACT_ADDRESS={receipt.contractAddress}")


if __name__ == "__main__":
    main()