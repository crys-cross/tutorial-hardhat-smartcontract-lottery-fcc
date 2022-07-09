import { assert, expect } from "chai"
import { BigNumber } from "ethers"
import { getNamedAccounts, ethers, network } from "hardhat"
import { developmentChains } from "../../helper-hardhat-config"
import { Raffle } from "../../typechain-types"

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Staging Test", () => {
          let raffle: Raffle
          let raffleEntranceFee: BigNumber
          let deployer: string

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              raffle = await ethers.getContract("Raffle", deployer)
              raffleEntranceFee = await raffle.getEntranceFee()
          })
          describe("fulfillRandomWords", () => {
              it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async () => {
                  //only enter the raffle
                  const startingTimeStamp = await raffle.getLatestTimeStamp()
                  const accounts = await ethers.getSigners()

                  await new Promise<void>(async (resolve, reject) => {
                      //setup listener before we enter the raffle just incase the blockchain moves really fast
                      //await raffle.enterRaffle({value: raffleEntranceFee})
                      raffle.once("WinnerPicked", async () => {
                          console.log("winnerPicked event fired")
                          try {
                              //add asserts here
                              const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnerEndingBalance = await accounts[0].getBalance()
                              const endingTimeStamp = await raffle.getLatestTimeStamp()

                              await expect(raffle.getPlayers(0)).to.be.reverted
                              assert.equal(recentWinner.toString(), accounts[0].address)
                              assert.equal(raffleState, 0)
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance.add(raffleEntranceFee).toString()
                              )
                              assert(endingTimeStamp > startingTimeStamp)
                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })
                      //then entering the raffle
                      console.log("Entering Raffle...")
                      await raffle.enterRaffle({ value: raffleEntranceFee })
                      //   await tx.wait(1)
                      console.log("Ok, time to wait...")
                      const winnerStartingBalance = await accounts[0].getBalance()
                      //and this code wont complete until our listener has finished listening
                  })
              })
          })
      })

//to test on testnet
//1 Get our subId for Chainlink VRF
//2 Deploy our contract using the subId
//3 Register the contract with Chainlink & ist subId
//4 Register the contract with Chainlink Keepers
// 5 Run staging test
