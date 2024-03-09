// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/Address.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract FootiuMM is IERC721Receiver {

    using Address for address payable;
    ERC721 public nftContract;

    address public dependencyAddress;

    struct NftDeposit {
        uint256 tokenId;
    }
    struct Auction {
        bool isAuction;
        uint256 timeStart;
    }

    mapping(address => NftDeposit[]) public nftDeposits;

    Auction public currentAuction;
    uint256 public numNFTs;
    uint256 public decayRate;
    uint256 public startingPrice;
    uint256 public currentPrice;

    uint256 public totalEthInBalance;

    uint256 public constant INITIAL_STARTING_PRICE = 1 ether;
    uint256 public constant EXPONENT = 2; // Exponent for the exponential decay function

    bool public isAuction;

    NftDeposit[] public nftsForSale;

    event Create(address indexed nft);
    event NftDeposited(address indexed user, address indexed nftContract, uint256 indexed tokenId);
    event NFTPurchased(address indexed user, uint256 indexed tokenId);
    event AuctionCreated(uint256 indexed auctionId, address indexed seller, uint256 indexed tokenId, uint256 startingPrice, uint256 duration);


    constructor(address _dependencyAddress, uint256 _decayRate) payable {
        require(msg.value >= 0.1 ether, "Insufficient initial ETH sent");
        nftContract = ERC721(_dependencyAddress);
        decayRate = _decayRate;
    }

    /* Implementing IERC721Receiver*/
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4) {
        // Implement the ERC721 token handling logic here
        // Return the ERC721_RECEIVED magic value
        return IERC721Receiver.onERC721Received.selector;
    }


    /* Dutch Auction Logic  */
    function createAuction(uint256 _tokenId) internal {
        startingPrice = address(this).balance;
        currentAuction.isAuction = true;
    }

    function updateAuction(uint256 _tokenId) internal {
        currentAuction.isAuction = true;
    }

    function closeAuction(uint256 _tokenId) internal {
        currentAuction.isAuction = false;
    }


    /*Bonding Curve Logic */

    // Calculate the price to buy NFTs based on the bonding curve 
    function calculateTokenPrice() public returns (uint256) {

        /**
            value >>= (t / halfLife);
    t %= halfLife;
    price = value - value * t / halfLife / 2;
 */     
        uint256 t = block.timestamp - currentAuction.timeStart;
        currentPrice >>= (t / decayRate);

        return currentPrice;

    }

    // Calculate the price to sell NFTs based on the bonding curve 
    function calculateTokenSale() public view returns (uint256) {
        uint256 currentSupply = numNFTs;
        return currentSupply;
    }

    /*a user is selling an NFT to the contract*/
    function NFTtoETHSwap(uint256 tokenId) public {
        // Transfer the NFT to this contract
        nftContract.safeTransferFrom(msg.sender, address(this), tokenId);

        uint256 salePrice = calculateTokenPrice();

        require(
            address(this).balance >= salePrice,
            "Insufficient balance"
        );

        if (nftsForSale.length == 0) {
            createAuction(
                 tokenId
                );
        } else {
            updateAuction(tokenId);
        }

        payable(msg.sender).transfer(salePrice);

        // Store the deposited NFT
        nftDeposits[msg.sender].push(NftDeposit(tokenId));
        nftsForSale.push(NftDeposit(1));

        // Emit event
        emit NftDeposited(msg.sender, dependencyAddress, tokenId);
    }

    function ETHtoNFTSwap(uint256 _tokenId) external payable {
        uint256 salePrice = calculateTokenPrice();

        require(msg.value >= salePrice, "Insufficient payment");

        // Transfer ownership of the NFT to the buyer
        nftContract.transferFrom(address(this), msg.sender, _tokenId);

        // Emit event
        emit NFTPurchased(msg.sender, _tokenId);
    }


    /* Implementing Getter Functions  */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getNFTsForSale() external view returns (uint256) {
        return nftsForSale.length;
    }



}


