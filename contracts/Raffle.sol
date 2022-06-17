// Raffle blueprint Brainstorming
//Steps
//1. Enter the lottery (Paying some amount)
//2. Pick a random winner(verifiebly random)
//3. Winner selected every X minutes -> completely automated
//Needs
//Chainlink Oracle -? Randomness, Automated execution(Chainlink Keepers)

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

error Raffle__NotEnoughEthEntered();

contract Raffle is VRFConsumerBaseV2 {
    /*State Variables*/
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;

    /*Events*/
    event RaffleEnter(address indexed player);

    constructor(address vrfCoordinatorV2, uint256 entranceFee) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
    }

    function enterRaffle() public payable {
        // require(msg.value > i_entranceFee, "Not enough ETH")
        if (msg.value < i_entranceFee) {
            revert Raffle__NotEnoughEthEntered();
        }
        s_players.push(payable(msg.sender));
        // Emit an event when we update a dynamic array or mapping
        // Named events with the function name reversed
        emit RaffleEnter(msg.sender);
    }

    function requestRandomWinner() external {
        // Request a random number
        // Once we get it, do something  with it
        // 2 transaction process
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal
        override
    {}

    /*View/Pure Functions*/
    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayers(uint256 index) public view returns (address) {
        return s_players[index];
    }
}
