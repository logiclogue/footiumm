# footiumm

Automated market maker for Footium.

- Build the contracts - `cd contract && npx hardhat --arbitrum-sepolia compile`
- Run the frontend - `cd frontend && npm run start`

### FootiuMM 
#### Method: calculateTokenPrice
- checks the time elapsed since the auction was reset
- Updates the current price according to the time passed and the decay rate 
- returns the price 

#### Method: NFTtoETHSwap
***The user transfers an NFT to the contract in exchange from some amount of ETH***
- transfers the NFT from the contract caller to the contract 
- gets the current price 
- ensure that the contract has enough ETH 
- Transfer the NFT from the user to the contract 
- check whether the contract has any NFTs, 
	- If not an auction is created calling ***createAuction***
	- If yes then the auction is updated to include the new NFT ***updateAuction***
- the swapper is transferred the current sale price in ETH 
- an event is emitted 

#### Method: ETHtoNFTSwap
***The user transfers some amount of ETH to the contract in exchange for an NFT***
- Checks the current NFT price 
- ensure that the swapper has enough ETH 
