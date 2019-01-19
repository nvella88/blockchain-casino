pragma solidity ^0.4.24;

contract Roulette{
    // The croupier is the creator/owner of the smart contract.
    address public croupier;
    
    // The roulette gas a fixed stake set by the croupier.
    uint private tableStakeInWei;
    
    bool private isTableOpen = false;
    bool private isBettingOpen = false;
    
    // Mapping to check if an address placed a bet on either odd or even numbers.
    // It is not allowed to bet on both in one session.
    mapping(address => bool) private oddBets;
    mapping(address => bool) private evenBets;

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

    // Common requirements to place bets, refactored under one modifier.
    // The croupier/owner cannot place a bet.
    // Payment must match stake.
    // Table is open and betting allowed.
    modifier bettingRequirements {
        require(!(croupier == msg.sender), "The house is not allowed to bet.");
        require(msg.value == tableStakeInWei, "Must match the table stake.");
        require(isTableOpen,"The table is not open.");
        require(isBettingOpen,"Betting is not open.");
        _;
    }

    constructor(uint stakeAmountInWei) public
    {
        require(stakeAmountInWei > 0, "A stake is required to open a table.");
        croupier = msg.sender;
        tableStakeInWei = stakeAmountInWei;
        isTableOpen = true;
        isBettingOpen = true;
    }

    // A function in which state is not changed. This is denoted by the view modifier.
    function getTableStake() public view returns (uint) {
        return tableStakeInWei;
    }

    // Place a bet that the resullt will be an odd number.
    function betOnOddNumber() public payable bettingRequirements
    {   
        // One cannot bet twice the same bet.
        require(!(oddBets[msg.sender]), "Already placed a similar bet.");
        // Either bet on odd or even.
        require(!(evenBets[msg.sender]), "Already placed a bet on even numbers.");
        
        oddBets[msg.sender] = true;
    }

    // Bet that the result will be an even number.
    function betOnEvenNumber() public payable bettingRequirements
    {        
        // One cannot bet twice the same bet.
        require(!(evenBets[msg.sender]), "Already placed a similar bet.");
        // Either bet on odd or even.
        require(!(oddBets[msg.sender]), "Already placed a bet on odd numbers.");
        
        evenBets[msg.sender] = true;
    }

    // Closes the table, destroying the smart contract.
    // Only the croupier is allowed to close the table.
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
