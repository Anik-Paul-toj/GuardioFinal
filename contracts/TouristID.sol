// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title TouristID
 * @dev NFT contract for blockchain-based digital tourist identification
 */
contract TouristID is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    
    // Mapping from user address to their tourist ID token
    mapping(address => uint256) public userToTokenId;
    mapping(uint256 => TouristData) public tokenIdToData;
    mapping(string => bool) public passportNumberUsed;
    
    struct TouristData {
        string encryptedDataHash;
        string passportNumber;
        string nationality;
        uint256 mintedAt;
        bool isActive;
    }
    
    event TouristIDMinted(
        address indexed user,
        uint256 indexed tokenId,
        string passportNumber,
        string nationality,
        uint256 timestamp
    );
    
    event TouristIDUpdated(
        uint256 indexed tokenId,
        string newDataHash,
        uint256 timestamp
    );
    
    event TouristIDRevoked(
        uint256 indexed tokenId,
        uint256 timestamp
    );

    constructor() ERC721("GuardioTouristID", "GTID") {}

    /**
     * @dev Mint a new Tourist ID NFT
     * @param to Address to mint the NFT to
     * @param encryptedDataHash Hash of encrypted tourist data
     * @param passportNumber Passport number (for uniqueness check)
     * @param nationality Tourist's nationality
     * @param tokenURI Metadata URI for the NFT
     */
    function mintTouristID(
        address to,
        string memory encryptedDataHash,
        string memory passportNumber,
        string memory nationality,
        string memory tokenURI
    ) public nonReentrant returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(encryptedDataHash).length > 0, "Data hash cannot be empty");
        require(bytes(passportNumber).length > 0, "Passport number cannot be empty");
        require(bytes(nationality).length > 0, "Nationality cannot be empty");
        require(userToTokenId[to] == 0, "User already has a Tourist ID");
        require(!passportNumberUsed[passportNumber], "Passport number already used");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        // Store tourist data
        tokenIdToData[tokenId] = TouristData({
            encryptedDataHash: encryptedDataHash,
            passportNumber: passportNumber,
            nationality: nationality,
            mintedAt: block.timestamp,
            isActive: true
        });

        // Mark passport as used and link user to token
        passportNumberUsed[passportNumber] = true;
        userToTokenId[to] = tokenId;

        // Mint the NFT
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        emit TouristIDMinted(to, tokenId, passportNumber, nationality, block.timestamp);

        return tokenId;
    }

    /**
     * @dev Update tourist data (only token owner)
     * @param tokenId Token ID to update
     * @param newEncryptedDataHash New hash of encrypted data
     * @param newTokenURI New metadata URI
     */
    function updateTouristData(
        uint256 tokenId,
        string memory newEncryptedDataHash,
        string memory newTokenURI
    ) public {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Only token owner can update");
        require(tokenIdToData[tokenId].isActive, "Tourist ID is not active");

        tokenIdToData[tokenId].encryptedDataHash = newEncryptedDataHash;
        _setTokenURI(tokenId, newTokenURI);

        emit TouristIDUpdated(tokenId, newEncryptedDataHash, block.timestamp);
    }

    /**
     * @dev Revoke a tourist ID (only owner)
     * @param tokenId Token ID to revoke
     */
    function revokeTouristID(uint256 tokenId) public onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        require(tokenIdToData[tokenId].isActive, "Tourist ID already inactive");

        tokenIdToData[tokenId].isActive = false;

        emit TouristIDRevoked(tokenId, block.timestamp);
    }

    /**
     * @dev Get tourist data for a token
     * @param tokenId Token ID to query
     */
    function getTouristData(uint256 tokenId) public view returns (TouristData memory) {
        require(_exists(tokenId), "Token does not exist");
        return tokenIdToData[tokenId];
    }

    /**
     * @dev Get token ID for a user address
     * @param user User address to query
     */
    function getUserTokenId(address user) public view returns (uint256) {
        return userToTokenId[user];
    }

    /**
     * @dev Check if a user has a valid Tourist ID
     * @param user User address to check
     */
    function hasValidTouristID(address user) public view returns (bool) {
        uint256 tokenId = userToTokenId[user];
        if (tokenId == 0) return false;
        return tokenIdToData[tokenId].isActive;
    }

    /**
     * @dev Get total number of minted Tourist IDs
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    /**
     * @dev Override transfer functions to make NFTs soulbound (non-transferable)
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        require(from == address(0) || to == address(0), "Tourist IDs are soulbound and non-transferable");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    /**
     * @dev Override approve to prevent approvals (soulbound)
     */
    function approve(address to, uint256 tokenId) public override {
        revert("Tourist IDs are soulbound and cannot be approved");
    }

    /**
     * @dev Override setApprovalForAll to prevent approvals (soulbound)
     */
    function setApprovalForAll(address operator, bool approved) public override {
        revert("Tourist IDs are soulbound and cannot be approved");
    }

    // The following functions are overrides required by Solidity.
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
