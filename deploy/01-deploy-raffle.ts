import { ethers } from "hardhat"
import { DeployFunction } from "hardhat-deploy/dist/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import {
    developmentChains,
    networkConfig,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} from "../helper-hardhat-config"
import verify from "../utils/verify"

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("30")

const deployRaffle: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { network, deployments, getNamedAccounts } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    // const chainId = network.config.chainId
    const chainId = 31337
    let vrfCoordinatorV2Address, subscriptionId

    if (chainId == 31337) {
        //create VRFV2 Subscription
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
        const transactionReceipt = await transactionResponse.wait()
        subscriptionId = transactionReceipt.events[0].args.subId
        // Fund the subscription, need LINK token on real network
        // Our mock makes it so we don't actually have to worry about sending fund
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)
    } else {
        vrfCoordinatorV2Address = networkConfig[network.config.chainId!]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[network.config.chainId!]["subscriptionId"]
    }
    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS
    log("----------------------------------------------------")
    console.log(vrfCoordinatorV2Address)

    const args: any[] = [
        vrfCoordinatorV2Address,
        networkConfig[network.config.chainId!]["raffleEntranceFee"],
        networkConfig[network.config.chainId!]["gasLane"],
        subscriptionId,
        networkConfig[network.config.chainId!]["callbackGasLimit"],
        networkConfig[network.config.chainId!]["keeperUpdateInterval"],
    ]
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: waitBlockConfirmations,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(raffle.address, args)
    }
    log("-----------------------------------------")
}

export default deployRaffle
deployRaffle.tags = ["all", "raffle"]
