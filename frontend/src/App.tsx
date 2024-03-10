import { useEffect, useState } from 'react';
import { ContextProvider, config } from './WagmiContextProvider';
import { useAccount, useReadContract, useWriteContract, useWatchContractEvent } from "wagmi";
import * as ethers from 'ethers';
import { useEthersProvider } from './ethers';
import Decimal from "decimal.js";
import './App.css';

const ENABLE_DONATIONS = true;

function ConnectButton() {
    return <w3m-button />;
}

export const useLoadContract = (name: string): { abi: any, address: string } => {
    const { chain } = useAccount();

    const networkFolder = chain?.name.toLowerCase().replace(" ", "-") || 'arbitrum-sepolia';

    const contractJson = require(`../contracts/${networkFolder}/${name}.json`);

    const address = contractJson.address;
    const abi = contractJson.abi;

    return {
        abi,
        address
    }
};

function useFetchMetadata(uri: string, isReady: boolean): any {
    const [metadata, setMetadata] = useState(false);

    useEffect(() => {
        (async () => {
            if (!isReady) {
                return;
            }

            try {
                const response = await fetch(uri);
                const metadata = await response.json();

                setMetadata(metadata);
            } catch (error) {
                console.error('Error fetching metadata:', error);
            }
        })();
    }, [uri, isReady]);

    return metadata;
}

function Player({ tokenId, isSelling, isBuying, isDonating }: { tokenId: string, isSelling?: boolean, isBuying?: boolean, isDonating?: boolean }) {
    const { writeContractAsync } = useWriteContract();
    const { address } = useAccount();
    const { abi: playerAbi, address: playerAddress } = useLoadContract("FootiumPlayer");
    const { abi: footiummAbi, address: footiummAddress } = useLoadContract("FootiuMM");

    const { data, isSuccess } = (useReadContract as any)({
        abi: playerAbi,
        address: playerAddress,
        functionName: 'tokenURI',
        args: [tokenId]
    });

    const { data: isApproved } = (useReadContract as any)({
        abi: playerAbi,
        address: playerAddress,
        functionName: 'isApprovedForAll',
        args: [address, footiummAddress]
    });

    const { data: sellPrice } = (useReadContract as any)({
        abi: footiummAbi,
        address: footiummAddress,
        functionName: 'sellPrice'
    });

    const { data: buyPrice } = (useReadContract as any)({
        abi: footiummAbi,
        address: footiummAddress,
        functionName: 'buyPrice'
    });

    const { data: tokenPrice } = (useReadContract as any)({
        abi: footiummAbi,
        address: footiummAddress,
        functionName: 'getDonateNftTokens'
    });

    const metadata = useFetchMetadata(data, isSuccess);

    if (!metadata) {
        return <div>...</div>;
    }

    const onSell = async (e: any) => {
        e.preventDefault();

        if (!isApproved) {
            try {
                await (writeContractAsync as any)({
                    abi: playerAbi,
                    address: playerAddress,
                    functionName: "setApprovalForAll",
                    args: [footiummAddress, true]
                });
            } catch (error) {
                console.error(error);

                alert("Failed to approve");

                return;
            }
        }

        try {
            await (writeContractAsync as any)({
                abi: footiummAbi,
                address: footiummAddress,
                functionName: "NFTtoETH",
                args: [parseInt(tokenId)]
            });
        } catch (error) {
            console.error(error);

            alert("Failed to sell");
        }
    };

    const onBuy = async (e: any) => {
        e.preventDefault();

        try {
            await (writeContractAsync as any)({
                abi: footiummAbi,
                address: footiummAddress,
                functionName: "ETHforNFT",
                args: [parseInt(tokenId)],
                value: buyPrice
            });
        } catch (error) {
            console.error(error);

            alert("Failed to buy");
        }
    };

    const onDonate = async (e: any) => {
        e.preventDefault();

        if (!isApproved) {
            try {
                await (writeContractAsync as any)({
                    abi: playerAbi,
                    address: playerAddress,
                    functionName: "setApprovalForAll",
                    args: [footiummAddress, true]
                });
            } catch (error) {
                alert("Failed to approve");

                return;
            }
        }

        try {
            await (writeContractAsync as any)({
                abi: footiummAbi,
                address: footiummAddress,
                functionName: "donateNft",
                args: [parseInt(tokenId)]
            });
        } catch (error) {
            alert("Failed to donate");
        }
    };

    return (
        <div className="text-center mb-4">
            <a href={metadata.external_url} target="_blank" rel="noopener noreferrer">
                <img src={metadata.image} alt={metadata.name} className="img-fluid" />
            </a>
            {isSelling && 
                <button
                    onClick={onSell}
                    className="btn btn-success w-100 mt-2"
                    disabled={!sellPrice}
                >
                    {sellPrice ? `Sell ${new Decimal(ethers.formatEther(sellPrice.toString())).toPrecision(3)} ETH` : "..."}
                </button>
            }
            {isBuying && 
                <button
                    onClick={onBuy}
                    className="btn btn-success w-100 mt-2"
                    disabled={!buyPrice}
                >
                    {buyPrice ? `Buy ${new Decimal(ethers.formatEther(buyPrice.toString())).toPrecision(3)} ETH` : "..."}
                </button>
            }
            {isDonating &&
                <button onClick={onDonate} className="btn btn-info w-100 mt-2">
                    Swap {new Decimal(ethers.formatEther(tokenPrice)).toPrecision(3)} PT
                </button>
            }
        </div>
    );
}

function SellPlayers() {
    const [transferEvents, setTransferEvents] = useState([]);
    const { address, chain } = useAccount();
    const player = useLoadContract("FootiumPlayer");

    const provider = useEthersProvider();

    const count = useWatchSales();

    useEffect(() => {
        const fetchTransferEvents = async () => {
            if (provider) {
                const contract: any = new ethers.Contract(player.address, player.abi, provider);
                const filterFrom = contract.filters.Transfer(address, null);
                const filterTo = contract.filters.Transfer(null, address);

                try {
                    const eventsFrom = await contract.queryFilter(filterFrom);
                    const eventsTo = await contract.queryFilter(filterTo);

                    const allEvents = [...eventsFrom, ...eventsTo];

                    allEvents.sort((a, b) => {
                        if (a.blockNumber === b.blockNumber) {
                            return a.transactionIndex - b.transactionIndex;
                        }
                        return a.blockNumber - b.blockNumber;
                    });

                    setTransferEvents(allEvents as any);
                } catch (error) {
                    console.error('Error fetching transfer events:', error);
                }
            }
        };

        if (chain?.id) {
            fetchTransferEvents();
        }
    }, [provider, address, chain?.id, count]);

    if (!transferEvents || transferEvents.length === 0) {
        return (
            <div>
                <ul>
                    ...
                </ul>
            </div>
        );
    }

    const playerIds = Object.entries(transferEvents.reduce((currentPlayerIds, event: any) => {
        if (event.args[1] === address) {
            return {
                ...currentPlayerIds,
                [event.args[2].toString()]: true
            };
        } else if (event.args[0] === address) {
            return {
                ...currentPlayerIds,
                [event.args[2].toString()]: false
            };
        }

        return currentPlayerIds;
    }, {})).filter(entry => entry[1]).map(entry => entry[0]);

    return (
        <div className="row">
            {playerIds.map(tokenId => (
                <div key={tokenId} className="col-md-4 col-sm-6 col-xs-12">
                    <Player tokenId={tokenId} isSelling={true} isDonating={ENABLE_DONATIONS} />
                </div>
            ))}
        </div>
    );
}

function BuyPlayers() {
    const [playerIds, setPlayerIds] = useState<string[]>([]);
    const { abi, address } = useLoadContract("FootiuMM");

    const count = useWatchSales();

    const { data: playersOnSaleString, isSuccess } = (useReadContract as any)({
        abi,
        address,
        functionName: 'getPlayersOnSale',
        scopeKey: count
    });

    useEffect(() => {
        if (isSuccess) {
            const result = playersOnSaleString.split(",");

            setPlayerIds(result);
        }
    }, [isSuccess, count]);

    return (
        <div className="row">
            {playerIds.map(tokenId => (
                <div key={tokenId} className="col-md-4 col-sm-6 col-xs-12">
                    <Player tokenId={tokenId} isBuying={true} />
                </div>
            ))}
        </div>
    );
}

function DonateETH() {
    const { isConnected } = useAccount();
    const { writeContract, writeContractAsync } = useWriteContract();
    const { address, abi } = useLoadContract("FootiuMM");
    const { address: tokenAddress, abi: tokenAbi } = useLoadContract("PoolToken");
    const [isUpdating, setIsUpdating] = useState(false);
    const [buyTokenInputValue, setBuyTokenInputValue] = useState(BigInt(0));
    const [sellTokenInputValue, setSellTokenInputValue] = useState(BigInt(0));

    const count = useWatchSales();

    const { data: totalTokenSupply } = (useReadContract as any)({
        address: tokenAddress,
        abi: tokenAbi,
        functionName: 'totalSupply',
        scopeKey: count
    });

    const { data: tokenEthValue } = (useReadContract as any)({
        address,
        abi,
        functionName: 'getDonateEthTokens',
        args: [buyTokenInputValue],
        scopeKey: count + buyTokenInputValue.toString()
    });

    const { data: ethValue } = (useReadContract as any)({
        address,
        abi,
        functionName: 'getTokenEthValue',
        args: [],
        scopeKey: count + sellTokenInputValue.toString()
    });

    const handleBuy = async (e: any) => {
        e.preventDefault();
        const amount = e.target.elements.amount.value;

        await (writeContractAsync as any)({
            abi,
            address,
            functionName: "donateEth",
            value: ethers.parseUnits(amount, "ether")
        });
    };

    const handleSell = async (e: any) => {
        e.preventDefault();
        const amount = e.target.elements.amount.value;

        try {
            await (writeContractAsync as any)({
                abi: tokenAbi,
                address: tokenAddress,
                functionName: "approve",
                args: [address, ethers.parseUnits(amount, "ether")]
            });
        } catch (error) {
            console.error(error);
        }

        await (writeContractAsync as any)({
            abi,
            address,
            functionName: "redeemTokenForEth",
            args: [ethers.parseUnits(amount, "ether")]
        });
    };
    
    const handleBuyChange = (event: any) => {
        if (!isUpdating) {
            setIsUpdating(true);

            setTimeout(() => {
                setBuyTokenInputValue(ethers.parseUnits(event.target.value || "0", "ether"));
                setIsUpdating(false);
            }, 1000);
        }
    };

    const handleSellChange = (event: any) => {
        if (!isUpdating) {
            setIsUpdating(true);

            setTimeout(() => {
                setBuyTokenInputValue(ethers.parseUnits(event.target.value || "0", "ether"));
                setIsUpdating(false);
            }, 1000);
        }
    };

    if (!isConnected) {
        return <div>...</div>;
    }

    return (
        <div className="text-left p-3 border rounded bg-light">
            <div className="mb-3">Pool token (PT) holders will earn 10% of fees from player sales that accures to the value of your pool token. Your total PT represents your share of the pool.</div>
            <p className="fs-5">Your pool tokens (PT): {new Decimal(ethers.formatEther(totalTokenSupply || 0)).toPrecision(3)}</p>
            <form onSubmit={handleBuy} className="mb-3">
                <input
                    type="text"
                    name="amount"
                    className="form-control mb-2"
                    placeholder="ETH amount"
                    onChange={handleBuyChange}
                    required
                />
                <button type="submit" className="btn btn-primary">Swap ETH for {new Decimal(ethers.formatEther(tokenEthValue || BigInt(0))).toPrecision(3)} PT</button>
            </form>
            <form onSubmit={handleSell} className="mb-3">
                <input
                    type="text"
                    name="amount"
                    className="form-control mb-2"
                    placeholder="PT amount"
                    required
                />
                <button type="submit" className="btn btn-primary">Swap 1 PT for {new Decimal(ethers.formatEther(ethValue || BigInt(0))).toPrecision(3)} ETH</button>
            </form>
        </div>
    );
}

function useWatchSales() {
    const [count, setCount] = useState(0);
    const { address, abi } = useLoadContract("FootiuMM");

    (useWatchContractEvent as any)({
        address,
        abi,
        eventName: 'PlayerforETH',
        onLogs(logs: any) {
            console.log('New logs!', logs)
            setCount(count + 1);
        },
    });

    (useWatchContractEvent as any)({
        address,
        abi,
        eventName: 'ETHforPlayer',
        onLogs(logs: any) {
            console.log('New logs!', logs)
            setCount(count + 1);
        }
    });

    (useWatchContractEvent as any)({
        address,
        abi,
        eventName: 'TokenRedeemedForEth',
        onLogs(logs: any) {
            console.log('New logs!', logs)
            setCount(count + 1);
        }
    });

    (useWatchContractEvent as any)({
        address,
        abi,
        eventName: 'EthDonated',
        onLogs(logs: any) {
            console.log('New logs!', logs)
            setCount(count + 1);
        }
    });

    (useWatchContractEvent as any)({
        address,
        abi,
        eventName: 'PlayerDonated',
        onLogs(logs: any) {
            console.log('New logs!', logs)
            setCount(count + 1);
        }
    });

    return count;
}

function CurrentPool() {
    const { isConnected } = useAccount();
    const { address, abi } = useLoadContract("FootiuMM");
    const { address: tokenAddress, abi: tokenAbi } = useLoadContract("PoolToken");

    const count = useWatchSales();

    const { data: numNFTsData } = (useReadContract as any)({
        address,
        abi,
        functionName: 'numNFTs',
        scopeKey: count
    });

    const { data: totalEthInBalanceData } = (useReadContract as any)({
        address,
        abi,
        functionName: 'totalEthInBalance',
        scopeKey: count
    });

    const { data: totalTokenSupply } = (useReadContract as any)({
        address: tokenAddress,
        abi: tokenAbi,
        functionName: 'totalSupply',
        scopeKey: count
    });

    const numNFTs = numNFTsData ? ethers.formatUnits(numNFTsData, 0) : 0;
    const totalEthInBalance = totalEthInBalanceData ? ethers.formatEther(totalEthInBalanceData || 0) : 0;

    if (!isConnected) {
        return <div>...</div>;
    }

    return (
        <div className="text-left p-3 border rounded bg-light">
            <p className="fs-5">Total NFTs in Pool: {numNFTs}</p>
            <p className="fs-5">Total ETH in Pool: {new Decimal(totalEthInBalance).toPrecision(3)}</p>
            <p className="fs-5">Total pool tokens (PT): {new Decimal(ethers.formatEther(totalTokenSupply || "0")).toPrecision(3)}</p>
        </div>
    );
}

function App() {
    return (
        <ContextProvider>
            <div className="App">
                <nav className="navbar navbar-dark bg-dark">
                    <div className="container-fluid">
                        <span className="navbar-brand mb-0 h1">FootiuMM</span>
                        <ConnectButton />
                    </div>
                </nav>

                <div className="container mt-4">
                    <div className="row">
                        <div className="col-md-6">
                            <h2>Current Pool</h2>
                            <CurrentPool />
                        </div>
                        {ENABLE_DONATIONS && (
                            <div className="col-md-6">
                                <h2>Earn</h2>
                                <DonateETH />
                            </div>
                        )}
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <h2>Sell NFTs</h2>
                            <SellPlayers />
                        </div>

                        <div className="col-md-6">
                            <h2>Buy NFTs</h2>
                            <BuyPlayers />
                        </div>
                    </div>
                </div>
            </div>
        </ContextProvider>
    );
}

export default App;
