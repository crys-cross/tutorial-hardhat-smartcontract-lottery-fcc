// Raffle blueprint Brainstorming
//Steps
//1. Enter the lottery (Paying some amount)
//2. Pick a random winner(verifiebly random)
//3. Winner selected every X minutes -> completely automated
//Needs
//Chainlink Oracle -? Randomness, Automated execution(Chainlink Keepers)

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

error Raffle__NotEnoughEthEntered();

contract Raffle {
    /*State Variables*/
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;

    /*Events*/
    event RaffleEnter(address indexed player);

    constructor(uint256 entranceFee) {
        i_entranceFee = entranceFee;
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

    // function pickRandomWinner() {}

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayers(uint256 index) public view returns (address) {
        return s_players[index];
    }
}
