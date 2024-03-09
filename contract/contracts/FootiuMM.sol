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

    mapping(address => NftDeposit[]) public nftDeposits;

    NftDeposit[] public nftsForSale;

    event Create(address indexed nft);
    event NftDeposited(address indexed user, address indexed nftContract, uint256 indexed tokenId);
    event NFTPurchased(address indexed user, uint256 indexed tokenId);


    constructor(address _dependencyAddress) payable {
        require(msg.value >= 0.1 ether, "Insufficient initial ETH sent");
        nftContract = ERC721(_dependencyAddress);
    }

    /* Implementing IERC721Receiver*/
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4) {
        // Implement the ERC721 token handling logic here
        // Return the ERC721_RECEIVED magic value
        return IERC721Receiver.onERC721Received.selector;
    }

    /*Core Application Logic */
    function SellNFT(uint256 tokenId) external {
        // Transfer the NFT to this contract
        IERC721(dependencyAddress).safeTransferFrom(msg.sender, address(this), tokenId);

        // Store the deposited NFT
        nftDeposits[msg.sender].push(NftDeposit(tokenId));

        // Emit event
        emit NftDeposited(msg.sender, dependencyAddress, tokenId);
    }


    function buyNFT(uint256 _tokenId) external {

        // Transfer ownership of the NFT to the buyer
        nftContract.transferFrom(address(this), msg.sender, _tokenId);

        emit NFTPurchased(msg.sender, _tokenId);
    }



    /* Implementing Getter Functions  */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }


}


