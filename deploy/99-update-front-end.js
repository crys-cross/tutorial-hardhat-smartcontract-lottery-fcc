const fs = require("fs")
const { ethers, network } = require("hardhat")

const frontEndContractsFile =
    "../../practice-nextjs-smartcontract-lottery-fcc/constants/contractAddresses.json"
const frontEndAbiFile = "../../practice-nextjs-smartcontract-lottery-fcc/constants/abi.json"

module.exports = async () => {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updating Front End")
        updateContractAddresses()
        updateAbi()
    }
}
const updateContractAddresses = async () => {
    const raffle = await ethers.getContract("Raffle")
    const chainId = network.config.chainId.toString()
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
module.exports.tags = ["all", "frontend"]
