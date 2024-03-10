// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "hardhat/console.sol";

contract FootiuMM is IERC721Receiver {

    using Address for address payable;
    ERC721 public nftContract;

    address public dependencyAddress;

    uint256 public numNFTs;
    uint256 public totalEthInBalance; 
    uint256[] public ForSaleNFTs;
    mapping(uint256 => uint256) private nftForSaleIndex;

    event PlayerforETH(address indexed user, uint256 indexed tokenId, uint256 price);
    event ETHforPlayer(address indexed user, uint256 indexed tokenId, uint256 price);


    constructor(address _dependencyAddress) payable {
        nftContract = ERC721(_dependencyAddress);
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

    function donateEth() public payable {
        totalEthInBalance += msg.value;
    }

    function donateNft(uint256 _tokenId) public {
        addPlayerToSale(_tokenId);
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

    function sellPrice() public returns(uint256) {
        uint256 k = address(this).balance * numNFTs;

        return address(this).balance-(k/(numNFTs+1));
    }

    function buyPrice() public returns(uint256) {
        uint256 k = address(this).balance * numNFTs;
        return k*(numNFTs-1)-address(this).balance;
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

        emit PlayerforETH(recipient, _tokenId, ethPayout);
    }
    
    //A player buying an NFT with ETH - sending ETH
    function ETHforNFT(uint256 _tokenId) public payable {
        require(numNFTs > 1, "block");

        uint256 ethPrice = sellPrice();

        require(msg.value >= ethPrice, "insufficient ETH");        

        removePlayerFromSale(_tokenId);

        nftContract.transferFrom(
            address(this), 
            msg.sender, 
            _tokenId
        );

        emit ETHforPlayer(msg.sender, _tokenId, ethPayout);
    }

    /* Implementing Getter Functions  */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getNFTsForSale() external view returns (uint256) {
        return ForSaleNFTs.length;
    }
}
