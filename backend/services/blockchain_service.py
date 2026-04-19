"""
services/blockchain_service.py — Real Ethereum (Sepolia testnet) blockchain integration.

Replaces the in-memory simulation with actual on-chain calls via Web3.py.

Setup:
  1. Deploy CredentialRegistry.sol to Sepolia → get CONTRACT_ADDRESS
  2. Fund your BLOCKCHAIN_WALLET_ADDRESS with Sepolia ETH (free from faucet)
  3. Add these to your .env:

     BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/<YOUR_KEY>
     BLOCKCHAIN_CONTRACT_ADDRESS=0x...
     BLOCKCHAIN_PRIVATE_KEY=0x...
     BLOCKCHAIN_WALLET_ADDRESS=0x...

Dependencies (add to requirements.txt):
  web3==6.20.3
  eth-account==0.13.4
"""

import os
import logging
from functools import lru_cache
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ── ABI (only the functions we use) ──────────────────────────────────────────
CONTRACT_ABI = [
    # Issuer management
    {"inputs": [{"internalType": "uint256", "name": "issuerId", "type": "uint256"}],
     "name": "addIssuer", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"internalType": "uint256", "name": "issuerId", "type": "uint256"}],
     "name": "removeIssuer", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"internalType": "uint256", "name": "issuerId", "type": "uint256"}],
     "name": "isTrustedIssuer", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
     "stateMutability": "view", "type": "function"},
    # Credential anchoring
    {"inputs": [{"internalType": "bytes32", "name": "hashId", "type": "bytes32"}],
     "name": "anchorCredential", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"internalType": "bytes32", "name": "hashId", "type": "bytes32"}],
     "name": "isIssued", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
     "stateMutability": "view", "type": "function"},
    # Revocation
    {"inputs": [{"internalType": "bytes32", "name": "hashId", "type": "bytes32"}],
     "name": "revokeCredential", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"internalType": "bytes32", "name": "hashId", "type": "bytes32"}],
     "name": "unrevokeCredential", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"internalType": "bytes32", "name": "hashId", "type": "bytes32"}],
     "name": "isRevoked", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
     "stateMutability": "view", "type": "function"},
]


# ── Blockchain client (lazy singleton) ───────────────────────────────────────

class BlockchainClient:
    """
    Wraps Web3 + contract.  Call `get_client()` to get the singleton.
    Falls back to a warning log + no-op if env vars are missing (dev mode).
    """

    def __init__(self):
        from web3 import Web3
        from eth_account import Account

        self._rpc_url: str = os.environ["BLOCKCHAIN_RPC_URL"]
        self._contract_address: str = os.environ["BLOCKCHAIN_CONTRACT_ADDRESS"]
        self._private_key: str = os.environ["BLOCKCHAIN_PRIVATE_KEY"]
        self._wallet_address: str = os.environ["BLOCKCHAIN_WALLET_ADDRESS"]

        self.w3 = Web3(Web3.HTTPProvider(self._rpc_url))
        if not self.w3.is_connected():
            raise RuntimeError(f"Cannot connect to RPC: {self._rpc_url}")

        checksum_addr = Web3.to_checksum_address(self._contract_address)
        self.contract = self.w3.eth.contract(
            address=checksum_addr,
            abi=CONTRACT_ABI,
        )
        self.account = Account.from_key(self._private_key)
        logger.info(
            "BlockchainClient connected to Sepolia | contract=%s | wallet=%s",
            checksum_addr,
            self._wallet_address,
        )

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _hash_to_bytes32(self, hash_id: str) -> bytes:
        """Convert a hex sha256 string to bytes32."""
        return bytes.fromhex(hash_id)

    def _send_tx(self, fn_call) -> str:
        """Build, sign, send a transaction; return tx hash."""
        nonce = self.w3.eth.get_transaction_count(self.account.address)
        gas_price = self.w3.eth.gas_price

        tx = fn_call.build_transaction({
            "from": self.account.address,
            "nonce": nonce,
            "gasPrice": gas_price,
        })

        # Gas estimation with 20% buffer
        try:
            estimated = self.w3.eth.estimate_gas(tx)
            tx["gas"] = int(estimated * 1.2)
        except Exception:
            tx["gas"] = 200_000  # fallback

        signed = self.w3.eth.account.sign_transaction(tx, self._private_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

        if receipt.status != 1:
            raise RuntimeError(f"Transaction reverted: {tx_hash.hex()}")

        logger.info("TX confirmed: %s (block %s)", tx_hash.hex(), receipt.blockNumber)
        return tx_hash.hex()

    # ── Issuer management ─────────────────────────────────────────────────────

    def add_issuer(self, issuer_id: int) -> str:
        return self._send_tx(self.contract.functions.addIssuer(issuer_id))

    def remove_issuer(self, issuer_id: int) -> str:
        return self._send_tx(self.contract.functions.removeIssuer(issuer_id))

    def is_trusted_issuer(self, issuer_id: int) -> bool:
        return self.contract.functions.isTrustedIssuer(issuer_id).call()

    # ── Credential anchoring ──────────────────────────────────────────────────

    def anchor_credential(self, hash_id: str) -> str:
        b32 = self._hash_to_bytes32(hash_id)
        return self._send_tx(self.contract.functions.anchorCredential(b32))

    def is_issued(self, hash_id: str) -> bool:
        b32 = self._hash_to_bytes32(hash_id)
        return self.contract.functions.isIssued(b32).call()

    # ── Revocation ────────────────────────────────────────────────────────────

    def revoke_credential(self, hash_id: str) -> str:
        b32 = self._hash_to_bytes32(hash_id)
        return self._send_tx(self.contract.functions.revokeCredential(b32))

    def unrevoke_credential(self, hash_id: str) -> str:
        b32 = self._hash_to_bytes32(hash_id)
        return self._send_tx(self.contract.functions.unrevokeCredential(b32))

    def is_revoked(self, hash_id: str) -> bool:
        b32 = self._hash_to_bytes32(hash_id)
        return self.contract.functions.isRevoked(b32).call()


# ── Fallback (dev mode when env vars are missing) ─────────────────────────────

class _FallbackClient:
    """No-op client used when blockchain env vars are not configured."""

    _warned = False

    def _warn(self, method: str):
        if not _FallbackClient._warned:
            logger.warning(
                "BLOCKCHAIN env vars not set — using in-memory fallback. "
                "Set BLOCKCHAIN_RPC_URL, BLOCKCHAIN_CONTRACT_ADDRESS, "
                "BLOCKCHAIN_PRIVATE_KEY, BLOCKCHAIN_WALLET_ADDRESS to enable Sepolia."
            )
            _FallbackClient._warned = True

    # In-memory stores (lost on restart)
    _issuers: set = set()
    _issued: set = set()
    _revoked: set = set()

    def add_issuer(self, issuer_id: int): self._issuers.add(issuer_id)
    def remove_issuer(self, issuer_id: int): self._issuers.discard(issuer_id)
    def is_trusted_issuer(self, issuer_id: int) -> bool: return issuer_id in self._issuers

    def anchor_credential(self, hash_id: str):
        self._issued.add(hash_id)

    def is_issued(self, hash_id: str) -> bool: return hash_id in self._issued

    def revoke_credential(self, hash_id: str):
        self._issued.discard(hash_id)
        self._revoked.add(hash_id)

    def unrevoke_credential(self, hash_id: str):
        self._revoked.discard(hash_id)
        self._issued.add(hash_id)

    def is_revoked(self, hash_id: str) -> bool: return hash_id in self._revoked


@lru_cache(maxsize=1)
def _get_client():
    required = [
        "BLOCKCHAIN_RPC_URL",
        "BLOCKCHAIN_CONTRACT_ADDRESS",
        "BLOCKCHAIN_PRIVATE_KEY",
        "BLOCKCHAIN_WALLET_ADDRESS",
    ]
    if all(os.getenv(k) for k in required):
        try:
            return BlockchainClient()
        except Exception as e:
            logger.error("BlockchainClient init failed: %s — using fallback", e)
            return _FallbackClient()
    else:
        return _FallbackClient()


# ── Public API (drop-in replacement for the old simulation) ──────────────────
# All callers import these functions; nothing else changes in routes / services.

def add_issuer(issuer_id: int) -> None:
    _get_client().add_issuer(issuer_id)


def remove_issuer(issuer_id: int) -> None:
    _get_client().remove_issuer(issuer_id)


def is_trusted_issuer(issuer_id: int) -> bool:
    return _get_client().is_trusted_issuer(issuer_id)


def get_all_trusted_issuers() -> list:
    """
    NOTE: on-chain we can't cheaply enumerate all issuers.
    This is only used by the /admin/blockchain debug endpoint.
    Returns empty list in real mode (events can be indexed off-chain if needed).
    """
    client = _get_client()
    if isinstance(client, _FallbackClient):
        return list(client._issuers)
    return []  # use an event indexer (e.g. The Graph) for production enumeration


def anchor_credential(hash_id: str) -> None:
    _get_client().anchor_credential(hash_id)


def is_issued(hash_id: str) -> bool:
    return _get_client().is_issued(hash_id)


def revoke_credential(hash_id: str) -> None:
    _get_client().revoke_credential(hash_id)


def unrevoke_credential(hash_id: str) -> None:
    _get_client().unrevoke_credential(hash_id)


def is_revoked(hash_id: str) -> bool:
    return _get_client().is_revoked(hash_id)


def get_all_issued_hashes() -> list:
    """Debug only — not queryable on-chain without event indexing."""
    client = _get_client()
    if isinstance(client, _FallbackClient):
        return list(client._issued)
    return []


def get_all_revoked_hashes() -> list:
    """Debug only — not queryable on-chain without event indexing."""
    client = _get_client()
    if isinstance(client, _FallbackClient):
        return list(client._revoked)
    return []