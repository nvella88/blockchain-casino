pragma solidity ^0.4.24;

contract Roulette{
    // The croupier is the creator of the smart cotract instance.
    address croupier;
    // The roulette gas a fixed stake set by the croupier.
    uint256 tableStake;
    bool isTableOpen = false;

    constructor(uint256 stakeAmount) public
    {
        croupier = msg.sender;
        tableStake = stakeAmount;
        isTableOpen = true;
    }
}
