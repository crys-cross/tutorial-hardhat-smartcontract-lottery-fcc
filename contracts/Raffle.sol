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
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

error Raffle__NotEnoughEthEntered();
error Raffle__TransferFailed();
error Raffle__NotOpen();
error Reffle__UpKeepNotNeeded(uint256 currentBalance, uint256 numpPlayers, uint256 raffleState);

/**
 * @title A sample Raffle Contract
 * @author Crys
 * @notice This contract is for creating an untamperable decentralized smart contract
 * @dev This implements Chainlink VRF v@ and Chainlink Keepers
 **/
contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface {
    /*Type declarations*/
    enum RaffleState {
        OPEN,
        CALCULATING
    } // same as(uint256 0 = OPEN, 1 = CALCULATING)

    /*State Variables*/
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    /*LotteryVariables*/
    address private s_recentWinner;
    RaffleState private s_raffleState;
    uint256 private s_lastTimeStamp;
    uint256 private immutable i_interval;

    /*Events*/
    event RaffleEnter(address indexed player);
    event RequestedRaffleWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed player); //to keep track list of recent winners

    /*Functions*/
    constructor(
        address vrfCoordinatorV2, //contract
        uint256 entranceFee,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
    }

    function enterRaffle() public payable {
        // require(msg.value > i_entranceFee, "Not enough ETH")
        if (msg.value < i_entranceFee) {
            revert Raffle__NotEnoughEthEntered();
        }
        if (s_raffleState != RaffleState.OPEN) {
            revert Raffle__NotOpen();
        }
        s_players.push(payable(msg.sender));
        // Emit an event when we update a dynamic array or mapping
        // Named events with the function name reversed
        emit RaffleEnter(msg.sender);
    }

    /**
     * @dev This is the function thet the Chainlink Keeper nodes call
     * they look for the `upKeepNeeded` to return true.
     * The following should be true in order to return true:
     * 1. Our time interval should have passed
     * 2. The lottery should have atleast 1 player, and have some ETH
     * 3. Our subscription is funded with LINK
     * 4. The Lottery should be in "open" state.
     **/
    function checkUpkeep(
        bytes memory /*checkData*/
    )
        public
        view
        override
        returns (
            bool upkeepNeeded,
            bytes memory /*performData*/
        )
    {
        bool isOpen = (RaffleState.OPEN == s_raffleState);
        bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
        bool hasPlayers = (s_players.length > 0);
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = (isOpen && timePassed && hasPlayers && hasBalance);
    }

    //renamed from requestRandomWinner
    // function perFormUpKeep(
    //     bytes calldata /*performData*/
    // ) external override {
    //     (bool upkeepNeeded, ) = checkUpKeep("");
    //     if (!upkeepNeeded) {
    //         revert Raffle__UpKeepNotNeeded(
    //             address(this).balance,
    //             s_players.length,
    //             uint256(s_raffleState)
    //         );
    //     }
    //     // Request a random number
    //     // Once we get it, do something  with it
    //     // 2 transaction process
    //     s_raffleState = RaffleState.CALCULATING;
    //     uint256 requestId = i_vrfCoordinator.requestRandomWords(
    //         i_gasLane, //keyHash(named gasLane)
    //         i_subscriptionId, //s_subscriptionId(named i_subscriptionId)
    //         REQUEST_CONFIRMATIONS, //requestConfirmations(named REQUEST_CONFIRMATIONS)
    //         i_callbackGasLimit, // callbackGasLimit(named )
    //         NUM_WORDS // numWords(named )
    //     );
    //     emit RequestedRaffleWinner(requestId);
    // }

    function performUpkeep(
        bytes calldata /* performData */
    ) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        // require(upkeepNeeded, "Upkeep not needed");
        if (!upkeepNeeded) {
            revert Reffle__UpKeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_raffleState)
            );
        }
        s_raffleState = RaffleState.CALCULATING;
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane, //keyHash(named gasLane)
            i_subscriptionId, //s_subscriptionId(named i_subscriptionId)
            REQUEST_CONFIRMATIONS, //requestConfirmations(named REQUEST_CONFIRMATIONS)
            i_callbackGasLimit, //callbackGasLimit(named i_callbackGasLimit)
            NUM_WORDS //numWords(named NUM_WORDS)
        );
        // Quiz... is this redundant?
        emit RequestedRaffleWinner(requestId);
    }

    function fulfillRandomWords(
        uint256, /*requestId*/
        uint256[] memory randomWords
    ) internal override {
        //s_players[] size 10
        //randomNumber 202
        //202 % 10 = 2
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        s_raffleState = RaffleState.OPEN;
        s_players = new address payable[](0);
        s_lastTimeStamp = block.timestamp;
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        //require success
        if (!success) {
            revert Raffle__TransferFailed();
        }
        emit WinnerPicked(recentWinner);
    }

    /*View/Pure Functions*/
    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayers(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getRaffleState() public view returns (RaffleState) {
        return s_raffleState;
    }

    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getNumberofPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getLatestTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getRequestConfirmations() public pure returns (uint256) {
        return REQUEST_CONFIRMATIONS;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }
}
