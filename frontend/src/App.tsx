import { useEffect, useState } from 'react';
import { ContextProvider, config } from './WagmiContextProvider';
import { useAccount, useReadContract, useWriteContract, useWatchContractEvent } from "wagmi";
import * as ethers from 'ethers';
import { useEthersProvider } from './ethers';
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

function Player({ tokenId }: { tokenId: string }) {
    const { abi, address } = useLoadContract("FootiumPlayer");

    const { data, isSuccess } = (useReadContract as any)({
        abi,
        address,
        functionName: 'tokenURI',
        args: [tokenId]
    });

    const metadata = useFetchMetadata(data, isSuccess);

    if (!metadata) {
        return <div>...</div>;
    }

    const onSell = () => {
        alert("You can't sell yet");
    }

    return (
        <div style={{ display: 'inline-block', textAlign: 'center' }}>
            <a href={metadata.external_url} target="_blank" rel="noopener noreferrer">
                <img src={metadata.image} alt={metadata.name} />
            </a>
            <button
                onClick={onSell}
                style={{
                    width: '100%', // Makes the button span the width of the image
                    padding: '10px',
                    marginTop: '5px',
                    backgroundColor: '#4CAF50', // Example color, change as needed
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1em'
                }}
            >
                Sell 0.2 ETH
            </button>
        </div>
    );
}

function Players() {
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

    console.log("transferEvents", transferEvents);

    if (!transferEvents || transferEvents.length === 0) {
        return (
            <div>
                <h2>Sell NFTs:</h2>
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
        <div>
            {playerIds.map(tokenId => (
                <Player tokenId={tokenId} />
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
        <form onSubmit={handleDonate}>
            <input
                type="text"
                name="amount"
                placeholder="ETH amount"
                required
            />
            <button type="submit">Donate ETH</button>
        </form>
    );
}

function CurrentPool() {
    return <div>TODO</div>;
}

function App() {
    return (
        <ContextProvider>
            <div className="App">
                <header className="App-header">
                    <div>FootiuMM</div>
                    <ConnectButton />
                    <h2>Current Pool</h2>
                    <CurrentPool />
                    {
                        ENABLE_DONATIONS ?
                        <div>
                            <h2>Donate ETH</h2>
                            <DonateETH />
                        </div>
                        : <div></div>
                    }
                    <h2>Sell NFTs</h2>
                    <Players />
                    <h2>Buy NFTs</h2>
                </header>
            </div>
        </ContextProvider>
    );
}

export default App;
