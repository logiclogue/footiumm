// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/Address.sol";


// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract FootiuMM is IERC721Receiver {

    using Address for address payable;

    address public dependencyAddress;

    struct NftDeposit {
        uint256 tokenId;
    }

    mapping(address => NftDeposit[]) public nftDeposits;

    event Create(address indexed nft);
    event NftDeposited(address indexed user, address indexed nftContract, uint256 indexed tokenId);


    constructor(address _dependencyAddress) {
        dependencyAddress = _dependencyAddress;
    }

    /* Implementing IERC721Receiver*/
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4) {
        // Implement the ERC721 token handling logic here
        // Return the ERC721_RECEIVED magic value
        return IERC721Receiver.onERC721Received.selector;
    }

    /*Core Application Logic */
    function depositNft(uint256 tokenId) external {
        // Transfer the NFT to this contract
        IERC721(dependencyAddress).safeTransferFrom(msg.sender, address(this), tokenId);

        // Store the deposited NFT
        nftDeposits[msg.sender].push(NftDeposit(tokenId));

        // Emit event
        emit NftDeposited(msg.sender, dependencyAddress, tokenId);
    }

    /* Implementing Getter Functions  */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }



}


