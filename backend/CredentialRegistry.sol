// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * CredentialRegistry.sol
 * Deployed on Sepolia testnet.
 *
 * Stores:
 *   - trusted issuer addresses (mapped from your DB issuer_id)
 *   - issued credential hashes
 *   - revoked credential hashes
 *
 * Owner = your backend wallet.
 */
contract CredentialRegistry {

    address public owner;

    // issuer_id (uint256 from your DB) → trusted?
    mapping(uint256 => bool) public trustedIssuers;

    // credential hash_id → issued?
    mapping(bytes32 => bool) public issuedCredentials;

    // credential hash_id → revoked?
    mapping(bytes32 => bool) public revokedCredentials;

    // ── Events ──────────────────────────────────────────
    event IssuerAdded(uint256 indexed issuerId);
    event IssuerRemoved(uint256 indexed issuerId);
    event CredentialAnchored(bytes32 indexed hashId);
    event CredentialRevoked(bytes32 indexed hashId);
    event CredentialUnrevoked(bytes32 indexed hashId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ── Issuer management ────────────────────────────────

    function addIssuer(uint256 issuerId) external onlyOwner {
        trustedIssuers[issuerId] = true;
        emit IssuerAdded(issuerId);
    }

    function removeIssuer(uint256 issuerId) external onlyOwner {
        trustedIssuers[issuerId] = false;
        emit IssuerRemoved(issuerId);
    }

    function isTrustedIssuer(uint256 issuerId) external view returns (bool) {
        return trustedIssuers[issuerId];
    }

    // ── Credential anchoring ─────────────────────────────

    function anchorCredential(bytes32 hashId) external onlyOwner {
        require(!issuedCredentials[hashId], "Already anchored");
        issuedCredentials[hashId] = true;
        emit CredentialAnchored(hashId);
    }

    function isIssued(bytes32 hashId) external view returns (bool) {
        return issuedCredentials[hashId];
    }

    // ── Revocation ───────────────────────────────────────

    function revokeCredential(bytes32 hashId) external onlyOwner {
        issuedCredentials[hashId] = false;
        revokedCredentials[hashId] = true;
        emit CredentialRevoked(hashId);
    }

    function unrevokeCredential(bytes32 hashId) external onlyOwner {
        revokedCredentials[hashId] = false;
        issuedCredentials[hashId] = true;
        emit CredentialUnrevoked(hashId);
    }

    function isRevoked(bytes32 hashId) external view returns (bool) {
        return revokedCredentials[hashId];
    }
}
