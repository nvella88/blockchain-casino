pragma solidity ^0.4.24;

contract Roulette{
    // The croupier is the creator/owner of the smart contract.
    address public croupier;
    
    // The roulette gas a fixed stake set by the croupier.
    uint private tableStakeInWei;    
    bool private isTableOpen = false;
    
    // Mapping to check if an address placed a bet on either odd or even numbers.
    // It is not allowed to bet on both in one session.
    mapping(address => bool) private oddBets;
    mapping(address => bool) private evenBets;

    int16 private winningNumber;
    bool private isWinningNumberOdd;

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
    // Table is open for betting.
    modifier bettingRequirements {
        require(!(croupier == msg.sender), "The house is not allowed to bet.");
        require(msg.value == tableStakeInWei, "Must match the table stake.");
        require(isTableOpen,"The table is not open.");
        _;
    }

    constructor(uint stakeAmountInWei) public
    {
        require(stakeAmountInWei > 0, "A stake is required to open a table.");
        croupier = msg.sender;
        tableStakeInWei = stakeAmountInWei;
        isTableOpen = true;
        winningNumber = -1;
    }

    // A function in which state is not changed. This is denoted by the view modifier.
    // This is a getter function, and is used to expose the value of private variables.
    // Security measure: Setter functions for these sensitive variables are protcted by the owner modifier.
    // These variables can be read but not tampered with.
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

    // A function in which checks is betting is allowed.
    // The idea behind this function is not to allow the roulette 'spin' while players are allowed to bet.
    function isBettingAllowed() public view returns (bool) {
        return isTableOpen;
    }

    // Closes the table for betting.
    // Only the croupier is allowed to close the table.
    // The function is called before drawing the number, that is, before the roulette starts 'spinning'.
    function closeBets() public ownerRequired {
        // We put a require so we do not spend unnecessary gas if the method is called consecutively.
        require(isTableOpen,"The table is already closed for bets.");
        isTableOpen = false;
    }

    // Sets the number drawn.
    // Only the croupier is allowed to set the number drawn.
    // The function is called after drawing the number, that is, after the 'spin' completes.
    function setWinningNumber(int16 numberDrawn) public ownerRequired {
        require(!isTableOpen,"The table must be closed for betting.");
        // The winning number can only se set once.
        // This is not the optimum solution but work for the purposes of this system under development.
        require(winningNumber < 0, "The winning number is already set.");
        require(numberDrawn >= 0 && numberDrawn <= 36, "A valid roulette number is required.");
        winningNumber = numberDrawn;
        isWinningNumberOdd = (winningNumber % 2 != 0);
    }

    // Get the winning number.
    function getWinningNumber() public view returns (int) {
        return winningNumber;
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
