pragma solidity ^0.4.24;

contract Roulette{
    // The croupier is the creator/owner of the smart contract.
    address croupier;
    // The roulette gas a fixed stake set by the croupier.
    uint256 tableStake;
    bool isTableOpen = false;

    // Function modifier which requires the caller 
    // of the function to be the owner of the contract.
    // Source: https://solidity.readthedocs.io/en/v0.5.1/structure-of-a-contract.html?highlight=modifiers#structure-function-modifiers
    modifier ownerRequired {
        require(
            msg.sender == croupier,
            "Only owner can call this function."
        );
        _;
    }

    constructor(uint256 stakeAmount) public
    {
        croupier = msg.sender;
        tableStake = stakeAmount;
        isTableOpen = true;
    }

    // Closes the table, destroying the smart contract.
    // Only the creator of the 
    function closeTable() public ownerRequired {
        // Convert croupier frm address to address payable.
        selfdestruct(address(uint160(croupier)));
    }

    // The fallback function is used when the smart contract is called 
    // with a function identifier which does not exist.
    function() external {
        revert("This function is not allowed. Try another one.");
    }
}
