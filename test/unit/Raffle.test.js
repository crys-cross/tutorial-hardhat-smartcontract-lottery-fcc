const { assert } = require("chai")
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Test", () => {
          let raffle, VRFCoordinatorV2Mock
          const chainId = network.config.chainId

          beforeEach(async () => {
              const { deployer } = await getNamedAccounts
              await deployments.fixture(["all"])
              raffle = await ethers.getContract("Raffle", deployer)
              VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
          })

          describe("constructor", async () => {
              it("initializes the raffle correctly", async () => {
                  // Ideally we make our tests have just 1 assert per "it"
                  const raffleState = await raffle.getRaffleState()
                  const interval = await raffle.getInterval()
                  assert.equal(raffleState.toString(), "0")
                  assert.equal(interval.toString(), networkConfig[chainId]["interval"])
              })
          })
      })
