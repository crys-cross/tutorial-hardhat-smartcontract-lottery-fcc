import fs from "fs"
import { ethers, network } from "hardhat"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const frontEndContractsFile =
    "../../practice-nextjs-smartcontract-lottery-fcc/constants/contractAddresses.json"
const frontEndAbiFile = "../../practice-nextjs-smartcontract-lottery-fcc/constants/abi.json"

const updateUI: DeployFunction = async () => {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updating Front End")
        updateContractAddresses()
        updateAbi()
    }
}
const updateContractAddresses = async () => {
    const raffle = await ethers.getContract("Raffle")
    const chainId = network.config.chainId!.toString()
    const currentAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))
    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId].includes(raffle.address)) {
            currentAddresses[chainId].push(raffle.address)
        }
    } else {
        currentAddresses[chainId] = [raffle.address]
    }
    fs.writeFileSync(frontEndContractsFile, JSON.stringify(currentAddresses))
    console.log("Front end written!")
}
const updateAbi = async () => {
    const raffle = await ethers.getContract("Raffle")
    fs.writeFileSync(frontEndAbiFile, raffle.interface.format(ethers.utils.FormatTypes.json))
}

// const updateUI: DeployFunction = async function (
//     hre: HardhatRuntimeEnvironment
//   ) {
//     const { network, ethers } = hre
//     const chainId = "31337"

//     if (process.env.UPDATE_FRONT_END) {
//         console.log("Writing to front end...")
//         const fundMe = await ethers.getContract("Raffle")
//         const contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))
//         if (chainId in contractAddresses) {
//             if (!contractAddresses[network.config.chainId!].includes(fundMe.address)) {
//                 contractAddresses[network.config.chainId!].push(fundMe.address)
//             }
//         } else {
//             contractAddresses[network.config.chainId!] = [fundMe.address]
//         }
//         fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))
//         console.log("Front end written!")
//     }
// }

export default updateUI
updateUI.tags = ["all", "frontend"]
