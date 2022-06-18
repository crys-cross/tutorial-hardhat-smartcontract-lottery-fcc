const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

module.export = async ({ getNamedAccounts, deployer }) => {
    const { deploy, log } = deployments
    const deployer = await getNamedAccounts()
    let vrfCoordinatorV2Address

    if (developmentChains.includes(network.name)) {
        const VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = VRFCoordinatorV2Mock.address
    }

    const args = []
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
}
