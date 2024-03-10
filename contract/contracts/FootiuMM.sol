// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "hardhat/console.sol";

contract FootiuMM is IERC721Receiver {

    using Address for address payable;
    ERC721 public nftContract;

    address public dependencyAddress;

    uint256 public numNFTs;
    uint256 public totalEthInBalance; 
    uint256[] public ForSaleNFTs;

    event PlayerforETH(address indexed user, uint256 indexed tokenId);
    event ETHforPlayer(address indexed user, uint256 indexed tokenId);


    constructor(address _dependencyAddress) payable {
        nftContract = ERC721(_dependencyAddress);
    }

    function donateEth() public payable {
        totalEthInBalance += msg.value;
    }

    function donateNft(uint256 _tokenId) public {
        numNFTs += 1;
        ForSaleNFTs.push(_tokenId); 
        nftContract.transferFrom(
            msg.sender, 
            address(this), 
            _tokenId
        );
    }

    /* Implementing IERC721Receiver*/
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4) {
        // Implement the ERC721 token handling logic here
        // Return the ERC721_RECEIVED magic value
        return IERC721Receiver.onERC721Received.selector;
    }

    function buyPrice() public returns(uint256) {
        uint256 k = address(this).balance * numNFTs;
        return k*(numNFTs-1)-address(this).balance;
    }

    function sellPrice() public returns(uint256) {
        uint256 k = address(this).balance * numNFTs;

        return address(this).balance-(k/(numNFTs+1));
    }

    //A player selling an NFT for ETH 
    function NFTtoETH(uint256 _tokenId) public {
        uint256 ethPayout = sellPrice();

        numNFTs += 1;

        ForSaleNFTs.push(_tokenId);

        nftContract.safeTransferFrom(
            msg.sender, 
            address(this), 
            _tokenId
        );

        address payable recipient = payable(msg.sender);

        recipient.transfer(ethPayout);

        emit PlayerforETH(recipient, _tokenId);
    }
    
    //A player buying an NFT with ETH 
    function ETHforNFT(uint256 _tokenId) public payable {
        require(numNFTs > 1, "block");

        uint256 ethPrice = sellPrice();

        require(msg.value >= ethPrice, "insufficient ETH");        
        
        numNFTs -= 1;

        ForSaleNFTs.pop();

        nftContract.transferFrom(
            address(this), 
            msg.sender, 
            _tokenId
        );

        emit ETHforPlayer(recipient, _tokenId);
    }

    /* Implementing Getter Functions  */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getNFTsForSale() external view returns (uint256) {
        return ForSaleNFTs.length;
    }



}


