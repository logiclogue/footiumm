// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import {PoolToken} from "./PoolToken.sol";

import "hardhat/console.sol";

contract FootiuMM is IERC721Receiver {
    using Address for address payable;
    ERC721 public nftContract;
    PoolToken public poolToken;
    address public dependencyAddress;

    uint256 public numNFTs;
    uint256 public totalEthInBalance; 
    uint256 public fee;
    uint256[] public ForSaleNFTs;
    mapping(uint256 => uint256) private nftForSaleIndex;

    event PlayerforETH(address indexed user, uint256 indexed tokenId, uint256 price);
    event ETHforPlayer(address indexed user, uint256 indexed tokenId, uint256 price);

    constructor(address _dependencyAddress, PoolToken _poolToken) payable {
        nftContract = ERC721(_dependencyAddress);
        poolToken = _poolToken;
        fee = 10;
    }

    function addPlayerToSale(uint256 _playerId) public {
        require(nftForSaleIndex[_playerId] == 0, "Player already on sale");

        numNFTs += 1;

        ForSaleNFTs.push(_playerId);

        nftForSaleIndex[_playerId] = ForSaleNFTs.length;
    }

    function removePlayerFromSale(uint256 _playerId) internal {
        require(nftForSaleIndex[_playerId] != 0, "Player not on sale");

        numNFTs -= 1;

        uint256 lastIndex = ForSaleNFTs.length - 1;
        uint256 lastPlayer = ForSaleNFTs[lastIndex];
        uint256 currentIndex = nftForSaleIndex[_playerId] - 1;
        ForSaleNFTs[currentIndex] = lastPlayer;
        nftForSaleIndex[lastPlayer] = currentIndex + 1;

        ForSaleNFTs.pop();

        delete nftForSaleIndex[_playerId];
    }

    function getPlayersOnSale() public view returns (string memory) {
        bytes memory output = abi.encodePacked(Strings.toString(ForSaleNFTs[0]));

        for (uint256 i = 1; i < ForSaleNFTs.length; i++) {
            output = abi.encodePacked(output, ",", Strings.toString(ForSaleNFTs[i]));
        }

        return string(output);
    }

    function isPlayerOnSale(uint256 _playerId) public view returns (bool) {
        return nftForSaleIndex[_playerId] != 0;
    }

    function getDonateEthTokens(uint256 _value) public returns(uint256) {
        if (totalEthInBalance == 0) {
            return 1;
        }

        return (_value * poolToken.totalSupply()) / (_value + 2 * totalEthInBalance);
    }

    function donateEth() public payable {
        uint256 tokens = getDonateEthTokens(msg.value);

        totalEthInBalance += msg.value;

        poolToken.mint(msg.sender, tokens);
    }

    function getDonateNftTokens() public returns(uint256) {
        if (numNFTs == 0) {
            return 1;
        }

        return poolToken.totalSupply() / (1 + 2 * numNFTs);
    }

    function donateNft(uint256 _tokenId) public {
        uint256 tokens = getDonateNftTokens();

        addPlayerToSale(_tokenId);
        nftContract.transferFrom(
            msg.sender, 
            address(this), 
            _tokenId
        );

        poolToken.mint(msg.sender, tokens);
    }

    /* Implementing IERC721Receiver*/
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4) {
        // Implement the ERC721 token handling logic here
        // Return the ERC721_RECEIVED magic value
        return IERC721Receiver.onERC721Received.selector;
    }

    function sellPrice() public returns(uint256) {
        uint256 k = totalEthInBalance * numNFTs;

        return totalEthInBalance-(k/(numNFTs+1));
    }

    function buyPrice() public returns(uint256) {
        uint256 k = totalEthInBalance * numNFTs;

        return (k/(numNFTs-1)-totalEthInBalance) * (100 + fee) / 100;
    }

    //A player selling an NFT for ETH - receiving ETH
    function NFTtoETH(uint256 _tokenId) public {
        uint256 ethPayout = sellPrice();

        addPlayerToSale(_tokenId);

        nftContract.safeTransferFrom(
            msg.sender, 
            address(this), 
            _tokenId
        );

        address payable recipient = payable(msg.sender);

        recipient.transfer(ethPayout);

        totalEthInBalance -= ethPayout;

        emit PlayerforETH(recipient, _tokenId, ethPayout);
    }
    
    //A player buying an NFT with ETH - sending ETH
    function ETHforNFT(uint256 _tokenId) public payable {
        require(numNFTs > 1, "block");
        uint256 ethPrice = buyPrice();

        require(msg.value >= ethPrice, "insufficient ETH");        
 
        removePlayerFromSale(_tokenId);

        nftContract.safeTransferFrom(
            address(this), 
            msg.sender, 
            _tokenId
        );

        totalEthInBalance += msg.value;

        emit ETHforPlayer(msg.sender, _tokenId, ethPrice);
    }

    function getTokenEthValue() public returns(uint256) {
        if (poolToken.totalSupply() == 0) {
            return 0;
        }

        return (1 / poolToken.totalSupply()) * (totalEthInBalance / 2);
    }

    function redeemTokenForEth(uint256 _tokens) public {
        uint256 payout = getTokenEthValue() * _tokens;

        poolToken.burnFrom(msg.sender, _tokens);

        address payable recipient = payable(msg.sender);

        totalEthInBalance -= payout;

        recipient.transfer(payout);
    }

    /* Implementing Getter Functions  */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getNFTsForSale() external view returns (uint256) {
        return ForSaleNFTs.length;
    }
}
