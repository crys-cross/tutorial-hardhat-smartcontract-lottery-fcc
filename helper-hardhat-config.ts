import { ethers } from "hardhat"

export interface networkConfigItem {
    name?: string
    vrfCoordinatorV2?: string
    raffleEntranceFee?: any
    gasLane?: string
    subscriptionId?: string
    callbackGasLimit?: string
    keeperUpdateInterval?: string
}

export interface networkConfigInfo {
    [key: number]: networkConfigItem
}

export const networkConfig: networkConfigInfo = {
    // Price Feed Address, values can be obtained at https://docs.chain.link/docs/reference-contracts
    // Default one is ETH/USD contract on Kovan
    31337: {
        name: "localhost",
        // vrfCoordinatorV2: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
        raffleEntranceFee: ethers.utils.parseEther("0.1"), // 0.1 ETH
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
        subscriptionId: "6727",
        callbackGasLimit: "500000" /*500,000*/,
        keeperUpdateInterval: "30",

        // ethUsdPriceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
    },
    4: {
        name: "rinkeby",
        vrfCoordinatorV2: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
        raffleEntranceFee: "100000000000000000", // 0.1 ETH
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
        subscriptionId: "6727", //for rinkeby
        callbackGasLimit: "500000" /*500,000*/,
        keeperUpdateInterval: "30",

        // ethUsdPriceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
    },
    80001: {
        name: "polygon(mumbai-testnet)",
        // ethUsdPriceFeed: "0x0715A7794a1dc8e42615F059dD6e406A6594651A",
    },
}

export const developmentChains = ["hardhat", "localhost"]
export const DECIMALS = 8
export const INITIAL_ANSWER = 200000000000
export const VERIFICATION_BLOCK_CONFIRMATIONS = 6
