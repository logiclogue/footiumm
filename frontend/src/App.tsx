import { useEffect, useState } from 'react';
import { ContextProvider, config } from './WagmiContextProvider';
import { useAccount, useReadContract, useWriteContract, useWatchContractEvent } from "wagmi";
import * as ethers from 'ethers';
import { commify, useEthersProvider } from './ethers';
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
                    {sellPrice ? `Sell ${ethers.formatEther(sellPrice.toString())} ETH` : "..."}
                </button>
            }
            {isBuying && 
                <button
                    onClick={onBuy}
                    className="btn btn-success w-100 mt-2"
                    disabled={!buyPrice}
                >
                    {buyPrice ? `Buy ${ethers.formatEther(buyPrice.toString())} ETH` : "..."}
                </button>
            }
            {isDonating &&
                <button onClick={onDonate} className="btn btn-info w-100 mt-2">
                    Donate
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
    }, [provider, chain?.id]);

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
                <div className="col-md-4 col-sm-6 col-xs-12">
                    <Player tokenId={tokenId} isSelling={true} isDonating={ENABLE_DONATIONS} />
                </div>
            ))}
        </div>
    );
}

function BuyPlayers() {
    const [playerIds, setPlayerIds] = useState<string[]>([]);
    const { abi, address } = useLoadContract("FootiuMM");

    const { data: playersOnSaleString, isSuccess } = (useReadContract as any)({
        abi,
        address,
        functionName: 'getPlayersOnSale'
    });

    useEffect(() => {
        if (isSuccess) {
            const result = playersOnSaleString.split(",");

            setPlayerIds(result);
        }
    }, [isSuccess]);

    return (
        <div className="row">
            {playerIds.map(tokenId => (
                <div className="col-md-4 col-sm-6 col-xs-12">
                    <Player tokenId={tokenId} isBuying={true} />
                </div>
            ))}
        </div>
    );
}

function DonateETH() {
    const { isConnected } = useAccount();
    const { writeContract } = useWriteContract();
    const { address, abi } = useLoadContract("FootiuMM");

    const handleDonate = (e: any) => {
        e.preventDefault();
        const amount = e.target.elements.amount.value;

        (writeContract as any)({
            abi,
            address,
            functionName: "donateEth",
            value: ethers.parseUnits(amount, "ether")
        });
    };

    if (!isConnected) {
        return <div>...</div>;
    }

    return (
        <form onSubmit={handleDonate} className="mb-3">
            <input
                type="text"
                name="amount"
                className="form-control mb-2"
                placeholder="ETH amount"
                required
            />
            <button type="submit" className="btn btn-primary">Donate ETH</button>
        </form>
    );
}

function CurrentPool() {
    const { isConnected } = useAccount();
    const { address, abi } = useLoadContract("FootiuMM");

    const { data: numNFTsData } = (useReadContract as any)({
        address,
        abi,
        functionName: 'numNFTs',
        watch: true
    });

    const { data: totalEthInBalanceData } = (useReadContract as any)({
        address,
        abi,
        functionName: 'totalEthInBalance',
        watch: true
    });

    (useWatchContractEvent as any)({
        address,
        abi,
        eventName: 'PlayerforETH',
        onLogs(logs: any) {
            console.log('New logs!', logs)
        },
    });

    (useWatchContractEvent as any)({
        address,
        abi,
        eventName: 'ETHforPlayer',
        onLogs(logs: any) {
            console.log('New logs!', logs)
        },
    });

    const numNFTs = numNFTsData ? ethers.formatUnits(numNFTsData, 0) : 0;
    const totalEthInBalance = totalEthInBalanceData ? ethers.formatEther(totalEthInBalanceData) : 0;

    if (!isConnected) {
        return <div>...</div>;
    }

    return (
        <div className="text-left p-3 border rounded bg-light">
            <p className="fs-5">Number of NFTs: {numNFTs}</p>
            <p className="fs-5">Total ETH in Balance: {totalEthInBalance}</p>
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
                                <h2>Donate ETH</h2>
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
