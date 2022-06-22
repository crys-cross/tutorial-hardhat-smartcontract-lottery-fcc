const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Test", () => {
          let raffle, VRFCoordinatorV2Mock, raffleEntranceFee, deployer, interval
          const chainId = network.config.chainId

          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              raffle = await ethers.getContract("Raffle", deployer)
              VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
              raffleEntranceFee = await raffle.getEntranceFee()
              interval = await raffle.getInterval()
          })

          describe("constructor", () => {
              it("initializes the raffle correctly", async () => {
                  // Ideally we make our tests have just 1 assert per "it"
                  const raffleState = await raffle.getRaffleState()
                  assert.equal(raffleState.toString(), "0")
                  assert.equal(interval.toString(), networkConfig[chainId]["interval"])
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
                  assert.equal(playerFromContract, deployer)
              })
              it("emits event on enter", async () => {
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.be.emit(
                      raffle,
                      "RaffleEnter"
                  )
              })
              it("doesn't allow entrance when raffle is calculating", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
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
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                  assert(!upkeepNeeded)
              })
              it("returns false if raffle isn't open", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
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
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
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
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const txResponse = await raffle.performUpkeep([])
                  const txReceipt = await txResponse.wait(1)
                  const requestId = txReceipt.events[1].args.requestId
                  const raffleState = await raffle.getRaffleState()
                  assert(requestId.toNumber() > 0)
                  assert(raffleState.toString() == "1")
              })
          })
          describe("fulfillRandomWords", () => {
              beforeEach(async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
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
              // big long test below /*currently too big to run on current set-up, commented out for the meanwhile*/
              //   it("picks a winner, resets the lottery, and sends money", async () => {
              //       const additionalEntrances = 3
              //       const startingAccountIndex = 1 // since deployer = 0

              //       for (
              //           let i = startingAccountIndex;
              //           i < startingAccountIndex + additionalEntrances;
              //           i++
              //       ) {
              //           const accountConnectedRaffle = raffle.connect(accounts[i])
              //           await accountConnectedRaffle.enterRaffle({ value: raffleEntranceFee })
              //       }
              //       const startingTimeStamp = await raffle.getLatestTimeStamp()
              //       // performUpKeep (mock being chainlink Keepers)
              //       // fulfillRandomWords (mock being chainlink VRF)
              //       // We will have to wait for the fulfillRandomWords to be called
              //       await new Promise(async (resolve, reject) => {
              //           raffle.once("WinnerPicked", async () => {
              //               console.log("Found the event!")
              //               try {
              //                   //   console.log(recentWinner)
              //                   //   console.log(accounts[2].address)
              //                   //   console.log(accounts[0].address)
              //                   //   console.log(accounts[1].address)
              //                   //   console.log(accounts[3].address)
              //                   const recentWinner = await raffle.getRecentWinner()
              //                   const raffleState = await raffle.getRaffleState()
              //                   const endingTimeStamp = await raffle.getLatestTimeStamp()
              //                   const numPlayers = await raffle.getNumberOfPlayers()
              //                   const winnerEndingBalance = await accounts[1].getBalance() //2
              //                   assert.equal(numPlayers.toString(), "0")
              //                   assert.equal(raffleState.toString(), "0")
              //                   assert(endingTimeStamp > startingTimeStamp)
              //                   assert.equal(
              //                       winnerEndingBalance.toString(),
              //                       winnerStartingBalance.add(
              //                           raffleEntranceFee
              //                               .mul(additionalEntrances)
              //                               .add(raffleEntranceFee)
              //                               .toSting()
              //                       ) //3
              //                   )
              //               } catch (e) {
              //                   reject(e)
              //               }
              //               resolve()
              //           })
              //           // setting up the listener
              //           // below we will fire the event, and the listener will pick it up
              //           const tx = await raffle.performUpKeep([])
              //           const txReceipt = await tx.wait(1)
              //           const winnerStartingBalance = await account[1].getBalance() //1
              //           await VRFCoordinatorV2Mock.fulfillRandomWords(
              //               txReceipt.events[1].args.requestId,
              //               raffle.address
              //           )
              //       })
              //   })
          })
      })
