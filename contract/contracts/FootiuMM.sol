// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/Address.sol";

// Uncomment this line to use console.log
import "hardhat/console.sol";

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
        uint256[] tokenIds; 
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
        nftContract = ERC721(_dependencyAddress);
        decayRate = _decayRate;
    }

    function donateEth() payable {
        totalEthInBalance += msg.value;
    }

    function donateNft(uint256 _tokenId) {
        numNFTs += 1;
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
        console.log('startingPrice1',startingPrice);
        currentAuction.isAuction = true;
        currentAuction.tokenIds.push(_tokenId);
    }

    function updateAuction(uint256 _tokenId) internal {
        currentAuction.isAuction = true;
    }

    function closeAuction(uint256 _tokenId) internal {
        currentAuction.isAuction = false;
    }


    /*Bonding Curve Logic */

    // Calculate the price to buy NFTs based on the bonding curve 
    function calculateTokenPrice(
        uint256 blockTimeStamp, 
        uint256 currentAuctionTimeStart
    ) public returns (uint256) {
        
        require(
            blockTimeStamp > currentAuctionTimeStart, 
            "time must have passed"
        );
        
        uint256 timeElapsed = blockTimeStamp - currentAuctionTimeStart;

        uint256 currentPrice = startingPrice >> (timeElapsed / decayRate);

        console.log('startingPrice',startingPrice);
        console.log('currentPrice',currentPrice);
        return currentPrice;

    }

    // Calculate the price to sell NFTs based on the bonding curve 
    function calculateTokenSale() public view returns (uint256) {
        uint256 currentSupply = numNFTs;
        return currentSupply;
    }

    /*Help Function*/
    // Check if a number is in an array
    function numberExists(uint256[] memory numbers, uint256 number) public view returns (bool) {
        for (uint256 i = 0; i < numbers.length; i++) {
            if (numbers[i] == number) {
                return true;
            }
        }
        return false;
    }


    /*a user is selling an NFT to the contract*/
    function NFTtoETHSwap(uint256 tokenId) public {
        // Transfer the NFT to this contract
        uint256 salePrice = calculateTokenPrice(
            block.timestamp,
            currentAuction.timeStart
        );

        require(
            address(this).balance >= salePrice,
            "Insufficient balance"
        );

        nftContract.safeTransferFrom(msg.sender, address(this), tokenId);

        if (nftsForSale.length == 0) {
            createAuction(
                 tokenId
                );
        } else {
            updateAuction(tokenId);
        }


        // Store the deposited NFT
        nftDeposits[msg.sender].push(NftDeposit(tokenId));
        nftsForSale.push(NftDeposit(1));

        // Send ETH to the swapper
        address payable recipient = payable(msg.sender);

        recipient.transfer(salePrice); 

        // Emit event
        emit NftDeposited(msg.sender, dependencyAddress, tokenId);
    }
    

    function ETHtoNFTSwap(uint256 _tokenId) external payable {
        uint256 salePrice = calculateTokenPrice(
            block.timestamp,
            currentAuction.timeStart
        );

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


