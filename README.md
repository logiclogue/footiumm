# footiumm

Automated market maker for Footium

## TODO - Project

- MVP - AMM with dutch auction and instant buy
    - Frontend
    - Smart contracts
    - No backend

- Ideas
    - ZK lottery for sales
    - NFT lending and borrowing protocol
    - Introduce a token

## TODO - Jordan

- (done) Add a frontend React project
- (done) Integrate wallet connect
- (TODO) Integrate existing Arbitrum Sepolia Footium contracts
- (TODO) Add a sell page which allows you to sell a player you own
- (TODO) Add a buy page allows you to buy from the list of players you have
- (BLOCKED) Frontend selling directly to the smart contract
- (BLOCKED) Frontend buying directly from the smart contract
- (BLOCKED) Show a list of transactions on the platform, buy and sell

## TODO - James

- (TODO) Create the hardhat project
- (TODO) Write the contract template
- (TODO) Create a floor pricing mechanism for players
- (TODO) Add in the ability to buy
- (TODO) Add in the ability to sell (dutch auction)


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
