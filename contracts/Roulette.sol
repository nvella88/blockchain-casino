pragma solidity ^0.4.24;

contract Roulette{
    // The croupier is the creator/owner of the smart contract.
    address public croupier;

    // Array of players participating in this table
    address[] public players;
    
    // The roulette gas a fixed stake set by the croupier.
    uint private tableStakeInWei;    
    bool private isTableOpen = false;
    
    // Mapping to check if an address placed a bet on either odd or even numbers.
    // It is not allowed to bet on both in one session.
    mapping(address => PlayerSession) private playerSessions;
    
    // Mapping which will be populated when a number is drawn and winnings set
    mapping(address => uint) private playerWinnings;

    int16 private winningNumber;
    OddEvenBet private winOddEven;

    // Enum representing the choices between odd and even betting
    enum OddEvenBet {
        None,
        Zero,
        OddNumber,
        EvenNumber
    }

    // A struct which holds player information for this gaming 'session'.
    // A session in this context is the betting information related to this particular table.
    struct PlayerSession {
        OddEvenBet oddEvenBet;
        bool isSessionCreated;
    }

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
        require(!(playerSessions[msg.sender].isSessionCreated == true && playerSessions[msg.sender].oddEvenBet == OddEvenBet.OddNumber), "Already placed a similar bet.");
        // Either bet on odd or even.
        require(!(playerSessions[msg.sender].isSessionCreated == true && playerSessions[msg.sender].oddEvenBet == OddEvenBet.EvenNumber), "Already placed a bet on even numbers.");
        
        registerPlayer(msg.sender);
        playerSessions[msg.sender].oddEvenBet = OddEvenBet.OddNumber; 
    }

    // Bet that the result will be an even number.
    function betOnEvenNumber() public payable bettingRequirements
    {        
        // One cannot bet twice the same bet.
        require(!(playerSessions[msg.sender].isSessionCreated == true && playerSessions[msg.sender].oddEvenBet == OddEvenBet.EvenNumber), "Already placed a similar bet.");
        // Either bet on odd or even.
        require(!(playerSessions[msg.sender].isSessionCreated == true && playerSessions[msg.sender].oddEvenBet == OddEvenBet.OddNumber), "Already placed a bet on odd numbers.");
    
        registerPlayer(msg.sender);
        playerSessions[msg.sender].oddEvenBet = OddEvenBet.EvenNumber;   
    }

    // Closes the table for betting.
    // Only the croupier is allowed to close the table.
    // The function is called before drawing the number, that is, before the roulette starts 'spinning'.
    function closeBets() public ownerRequired {
        // We put a require so we do not spend unnecessary gas if the method is called consecutively.
        require(isTableOpen,"The table is already closed for bets.");
        isTableOpen = false;
    }

    // Sets the number drawn and assigns winnings.
    // Only the croupier is allowed to set the number drawn.
    // The function is called after drawing the number, that is, after the 'spin' completes.
    function setWinningNumber(int16 numberDrawn) public ownerRequired {
        require(!isTableOpen,"The table must be closed for betting.");
        // The winning number can only se set once.
        // This is not the optimum solution but work for the purposes of this system under development.
        require(winningNumber < 0, "The winning number is already set.");
        require(numberDrawn >= 0 && numberDrawn <= 36, "A valid roulette number is required.");
        
        winningNumber = numberDrawn;

        if (winningNumber == 0)
        {
            winOddEven = OddEvenBet.Zero;
        } else if (winningNumber % 2 == 0) {
            winOddEven = OddEvenBet.EvenNumber;
        } else {
            winOddEven = OddEvenBet.OddNumber;
        }

        // Iterate through all the players registered with this table
        for(uint i = 0; i < players.length; i++){
            // Get the session for this table
            PlayerSession memory playerSession = playerSessions[players[i]];
            uint totalWinAmount = 0;

            // Process Odd / Even bets; with 1:1 winning ratio.
            if (playerSession.oddEvenBet == winOddEven)
            {
                totalWinAmount += (tableStakeInWei * 2);
            }

            /** Here go other winning processing computations. 
             ** No other code is added because this smart contract support only one type of bet. 
             */

             // At the end of it all map the winnings
             playerWinnings[players[i]] = totalWinAmount;
        }
    }

    // Winnings are not paid automatically, instead the users call the withdraw function.
    // 
    function withdrawWinnings() public {
        require(!isTableOpen,"The table is not closed for betting.");
        require(winningNumber > -1, "No winning number is set.");
        require(playerWinnings[msg.sender] != 0, "There are no withdrawable winnings.");
        require(address(this).balance >= playerWinnings[msg.sender], "There are not enough funds to transfer.");
        uint transferAmount = playerWinnings[msg.sender];
        
        // Set the winnings mapping to 0 before the transfer.
        playerWinnings[msg.sender] = 0;
        msg.sender.transfer(transferAmount);
    }

    // A function in which checks is betting is allowed.
    // The idea behind this function is not to allow the roulette 'spin' while players are allowed to bet.
    function isBettingAllowed() public view returns (bool) {
        return isTableOpen;
    }

    // Get the winning number.
    function getWinningNumber() public view returns (int) {
        return winningNumber;
    }

    // Get the winning number.
    function isPlayerSessionCreated(address player) public ownerRequired view returns (bool) {
         return playerSessions[player].isSessionCreated;
    }

    // Check own winnings.
    function getWithdrawableBalance() public view returns (uint) {
        require(!isTableOpen,"The table is not closed for betting.");
        require(winningNumber > -1, "No winning number is set.");
        return playerWinnings[msg.sender];
    }

    // Closes the table, destroying the smart contract.
    // Only the croupier is allowed to close the table.
    function closeTable() public ownerRequired {
        // Convert croupier frm address to address payable.
        selfdestruct(address(uint160(croupier)));
    }

    // Registers a new player, setting up all the required sessson information.
    function registerPlayer(address player) private{
        // If a new player, it is added to the address list
        if(!playerSessions[msg.sender].isSessionCreated)
        {
            players.push(player);
            playerSessions[msg.sender] = PlayerSession(OddEvenBet.None, true);
        }
    }

    // The fallback function is used when the smart contract is called 
    // with a function identifier which does not exist.
    function() external {
        revert("This function is not allowed. Try another one.");
    }
}
