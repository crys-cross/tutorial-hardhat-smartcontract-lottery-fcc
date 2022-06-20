const { getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Test", () => {
          let raffle, VRFCoordinatorV2Mock

          beforeEach(async () => {
              const { deployer } = await getNamedAccounts
              await deployments.fixture(["all"])
              raffle = await ethers.getContract("Raffle", deployer)
          })
      })
