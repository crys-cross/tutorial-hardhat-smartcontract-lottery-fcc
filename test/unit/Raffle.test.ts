import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { equal } from "assert"
import { assert, expect } from "chai"
import { BigNumber } from "ethers"
import { getNamedAccounts, deployments, ethers, network } from "hardhat"
import { developmentChains, networkConfig } from "../../helper-hardhat-config"
import { Raffle, VRFCoordinatorV2Mock } from "../../typechain-types"

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Test", () => {
          let raffle: Raffle
          let raffleContract: Raffle
          let VRFCoordinatorV2Mock: VRFCoordinatorV2Mock
          let raffleEntranceFee: BigNumber
          let interval: number
          let player: SignerWithAddress
          let accounts: SignerWithAddress[]

          beforeEach(async () => {
              accounts = await ethers.getSigners()
              player = accounts[1]
              await deployments.fixture(["mocks", "raffle"])
              VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
              raffleContract = await ethers.getContract("Raffle")
              raffle = raffleContract.connect(player)
              raffleEntranceFee = await raffle.getEntranceFee()
              interval = (await raffle.getInterval()).toNumber()
          })

          describe("constructor", () => {
              it("initializes the raffle correctly", async () => {
                  // Ideally we make our tests have just 1 assert per "it"
                  const raffleState = (await raffle.getRaffleState()).toString()
                  assert.equal(raffleState, "0")
                  assert.equal(
                      interval.toString(),
                      networkConfig[network.config.chainId!]["keeperUpdateInterval"]
                  )
              })
          })
          describe("enterRaffle", () => {
              it("reverts when you don't pay enough", async () => {
                  await expect(raffle.enterRaffle()).to.be.revertedWith(
                      "Raffle__NotEnoughEthEntered"
                  )
              })
              it("records players when they enter", async () => {
                  // raffle entrance fee
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  const playerFromContract = await raffle.getPlayers(0)
                  assert.equal(player.address, playerFromContract)
              })
              it("emits event on enter", async () => {
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.be.emit(
                      raffle,
                      "RaffleEnter"
                  )
              })
              it("doesn't allow entrance when raffle is calculating", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  // await network.provider.send("evm_mine", []) /*same as above*/
                  await raffle.performUpkeep([])
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.be.revertedWith(
                      "Raffle__NotOpen"
                  )
              })
          })
          describe("checkUpKeep", () => {
              it("returns false if people haven't sent enough ETH", async () => {
                  await network.provider.send("evm_increaseTime", [interval + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                  assert(!upkeepNeeded)
              })
              it("returns false if raffle isn't open", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  await raffle.performUpkeep([] /*or "0x" for sending blank bytes object*/)
                  const raffleState = await raffle.getRaffleState()
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                  assert.equal(raffleState.toString(), "1")
                  assert.equal(upkeepNeeded, false)
              })
              /*To be written later challenge*/
              // it("returns false if enough time hasn't passed", async () => {}
              // it("returns true if enough time has passed, has players, eth, and is open", async () => {}
          })
          describe("performUpKeep", () => {
              it("it can only run if checkUpKeep is true", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const tx = await raffle.performUpkeep([])
                  assert(tx)
              })
              it("reverts if checkup is false", async () => {
                  await expect(raffle.performUpkeep([])).to.be.revertedWith(
                      "Reffle__UpKeepNotNeeded"
                  )
              })
              it("updates the raffle state, emits an event, and calls the vrf coordinator", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const txResponse = await raffle.performUpkeep([])
                  const txReceipt = await txResponse.wait(1)
                  const requestId = txReceipt!.events![1].args!.requestId
                  const raffleState = await raffle.getRaffleState()
                  assert(requestId.toNumber() > 0)
                  assert(raffleState.toString() == "1")
              })
          })
          describe("fulfillRandomWords", () => {
              beforeEach(async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
              })
              it("can only be called after performUpkeep", async () => {
                  await expect(
                      VRFCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
                  ).to.be.revertedWith("nonexistent request")
                  await expect(
                      VRFCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)
                  ).to.be.revertedWith("nonexistent request")
              })
              //big long test below /*currently too big to run on current set-up, commented out for the meanwhile*/
              it("picks a winner, resets the lottery, and sends money", async () => {
                  const additionalEntrances = 3
                  const startingAccountIndex = 2 // since deployer = 0

                  for (
                      let i = startingAccountIndex;
                      i < startingAccountIndex + additionalEntrances;
                      i++
                  ) {
                      //   const accountConnectedRaffle = raffle.connect(accounts[i])
                      //   await accountConnectedRaffle.enterRaffle({ value: raffleEntranceFee })
                      raffle = raffleContract.connect(accounts[i])
                      await raffle.enterRaffle({ value: raffleEntranceFee })
                  }
                  const startingTimeStamp = await raffle.getLatestTimeStamp()
                  // performUpKeep (mock being chainlink Keepers)
                  // fulfillRandomWords (mock being chainlink VRF)
                  // We will have to wait for the fulfillRandomWords to be called
                  await new Promise<void>(async (resolve, reject) => {
                      raffle.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!")
                          try {
                              //   console.log(recentWinner)
                              //   console.log(accounts[2].address)
                              //   console.log(accounts[0].address)
                              //   console.log(accounts[1].address)
                              //   console.log(accounts[3].address)
                              const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnerBalance = await accounts[2].getBalance()
                              const endingTimeStamp = await raffle.getLatestTimeStamp()
                              //   const numPlayers = await raffle.getNumberOfPlayers()
                              //   const winnerEndingBalance = await accounts[1].getBalance() //2
                              await expect(raffle.getPlayers(0)).to.be.reverted
                              assert.equal(recentWinner.toString(), accounts[2].address)
                              assert.equal(raffleState, 0)
                              // assert.equal(numPlayers.toString(), "0")
                              //   assert(endingTimeStamp > startingTimeStamp)
                              assert.equal(
                                  winnerBalance.toString(),
                                  winnerStartingBalance
                                      .add(
                                          raffleEntranceFee
                                              .mul(additionalEntrances)
                                              .add(raffleEntranceFee)
                                      )
                                      .toString() //3
                              )
                              assert(endingTimeStamp > startingTimeStamp)
                              resolve()
                          } catch (e) {
                              reject(e)
                          }
                      })
                      // setting up the listener
                      // below we will fire the event, and the listener will pick it up
                      const tx = await raffle.performUpkeep([]) //or ("0x") fpr empty
                      const txReceipt = await tx.wait(1)
                      const winnerStartingBalance = await accounts[2].getBalance() //1
                      await VRFCoordinatorV2Mock.fulfillRandomWords(
                          txReceipt!.events![1].args!.requestId,
                          raffle.address
                      )
                  })
              })
          })
      })
