const Roulette = artifacts.require("Roulette");

contract("Roulette", accounts => {
    // Truffle deploys the smart contract using the first address by default.
    // This makes the first account the croupier.
    const [firstAccount, secondAccount, thirdAccount, fourthAccount] = accounts;
    let roulette;

    // Common setup before executing each test.
    // Creating a new instance before each test is expensive and running these tests too many times will quickly deplete ether.
    // The reason a new instance is created is to ensure atomicity of every test, 
    // that is the behaviour of a test is not affected by the execution of others.
    beforeEach('setup contract for each test', async function () {
        roulette = await Roulette.new(10)
    })

    // Ensures that the correct stake value is returned.
    // The stake value is displayed on the front-end part.
    it("should return the correct table stake value", async () => {
        var result = await roulette.getTableStake();
        assert(result, 10);
    });

    // Checks if a player session has been created.
    // A player session is the interaction (in this case bets) a user made on this smart contract.
    // The bets are stored and the necessary calculations are done after the number is drawn.
    it("should not create a session if a player has never placed a bet", async () => {
        var result = await roulette.isPlayerSessionCreated(secondAccount, { from: firstAccount });
        assert(result === false);
    });

    // Checks if a player session has been created.
    // A player session is the interaction (in this case bets) a user made on this smart contract.
    // The bets are stored and the necessary calculations are done after the number is drawn.
    it("should create a session if a user placed a bet", async () => {
        await roulette.betOnOddNumber({ from: secondAccount, value: 10 });
        var result = await roulette.isPlayerSessionCreated(secondAccount, { from: firstAccount });
        assert(result === true);
    });

    // Ensure the croupier cannot place bets.
    // The idea is to simulate 'fairness' in which the house cannot place bets against itself.
    // Source: https://medium.com/@gus_tavo_guim/testing-your-smart-contracts-with-javascript-40d4edc2abed
    it("should not allow croupier to place a bet", async () => {
        try {
            await roulette.betOnOddNumber({ from: firstAccount, value: 10 });
            assert.fail()
        } catch (error) {
            assert(error.toString().includes('The house is not allowed to bet.'), error.toString())
        }
    });

    // All bets need to match the table stake.
    it("should not allow bets which do not match stake", async () => {
        try {
            await roulette.betOnOddNumber({ from: secondAccount, value: 11 });
            assert.fail()
        } catch (error) {
            assert(error.toString().includes('Must match the table stake.'), error.toString());
        }
    });

    // A user cannot bet twice on the same bet.
    it("should not allow duplicte bets", async () => {
        // Valid bet
        await roulette.betOnOddNumber({ from: secondAccount, value: 10 });

        try {
            // Duplicate bet
            await roulette.betOnOddNumber({ from: secondAccount, value: 10 });
            assert.fail()
        } catch (error) {
            assert(error.toString().includes('Already placed a similar bet.'), error.toString());
        }
    });

    // A user cannot bet on opposing bets.
    it("should not allow betting on both odd and even numbers", async () => {
        // Valid bet: Odd
        await roulette.betOnOddNumber({ from: secondAccount, value: 10 });

        try {
            // Invalid bet: Even
            await roulette.betOnEvenNumber({ from: secondAccount, value: 10 });
            assert.fail()
        } catch (error) {
            assert(error.toString().includes('Already placed a bet on odd numbers.'), error.toString());
        }
    });

    // When a table closes, bets are not allowed.
    // The idea behind closing a table is to give time to all transactions to be mined before drawing the number.
    it("should not allow betting when the table is closed for betting", async () => {
        await roulette.closeBets({ from: firstAccount });

        try {
            // Invalid bet: Even
            await roulette.betOnEvenNumber({ from: secondAccount, value: 10 });
            assert.fail()
        } catch (error) {
            assert(error.toString().includes('The table is not open.'), error.toString());
        }
    });

    // The winning number should be set and read correctly.
    it("should set the winning number correctly", async () => {
        await roulette.closeBets({ from: firstAccount });
        await roulette.setWinningNumber(5);

        var winningNumber = roulette.getWinningNumber();
        assert(winningNumber, 5);

    });

    // The table must be closed to set a winning number.
    // This is used to make sure that users cannot bet while the winning number is set.
    it("should not set the winning number if bets are allowed", async () => {
        try {
            await roulette.setWinningNumber(5);
            assert.fail()
        } catch (error) {
            assert(error.toString().includes('The table must be closed for betting.'), error.toString());
        }
    });

    // Roulettes allow numbers between 0 and 36.
    it("should not set the winning number if input is invalid", async () => {
        await roulette.closeBets({ from: firstAccount });
        try {
            await roulette.setWinningNumber(40);
            assert.fail()
        } catch (error) {
            assert(error.toString().includes('A valid roulette number is required.'), error.toString());
        }
    });

    // A winning number cannot be set twice.
    // This is a preventative measure to promote fairness.
    it("should not set the winning number twice", async () => {
        await roulette.closeBets({ from: firstAccount });
        await roulette.setWinningNumber(5);
        try {
            await roulette.setWinningNumber(7);
            assert.fail()
        } catch (error) {
            assert(error.toString().includes('The winning number is already set.'), error.toString());
        }
    });

    // The correct withdrawable balance should be provided.
    // The test was written to cover one of the most important functionalities of the contract, 
    // that is, to ensure that the winners and their winning amount are calculated correctly.
    it("should provide the correct withdrawable balance", async () => {
        // Place some bets, close betting and set a winning number.
        await roulette.betOnOddNumber({ from: secondAccount, value: 10 });
        await roulette.betOnEvenNumber({ from: thirdAccount, value: 10 });
        await roulette.betOnEvenNumber({ from: fourthAccount, value: 10 });
        await roulette.closeBets({ from: firstAccount });
        await roulette.setWinningNumber(5);

        var resultSecondAccount = await roulette.getWithdrawableBalance({ from: secondAccount});
        var resultThirdAccount = await roulette.getWithdrawableBalance({ from: thirdAccount});
        var resultFourthAccount = await roulette.getWithdrawableBalance({ from: fourthAccount});
        
        assert.equal(resultSecondAccount.toString(), 20)
        assert.equal(resultThirdAccount.toString(), 0)
        assert.equal(resultFourthAccount.toString(), 0)
    });

    // Users are not allowed to withdraw winnings twice.
    // The test covers an important piece of logic in which a user can exploit the system and withdraw the winnings twice.
    it("should not allow to withdraw winnings twice", async () => {
        // Place some bets, close betting and set a winning number.
        await roulette.betOnOddNumber({ from: secondAccount, value: 10 });
        await roulette.betOnEvenNumber({ from: thirdAccount, value: 10 });
        await roulette.betOnEvenNumber({ from: fourthAccount, value: 10 });
        await roulette.closeBets({ from: firstAccount });
        await roulette.setWinningNumber(5);

        await roulette.withdrawWinnings({ from: secondAccount});

        try {
            await roulette.withdrawWinnings({ from: secondAccount});
            assert.fail()
        } catch (error) {
            assert(error.toString().includes('There are no withdrawable winnings.'), error.toString());
        }
    });

    // Users not eligible for winnings are not allowed to withdraw.
    // The test was written to ensure that only eligible users are able to withdraw winnings.
    it("should not allow losing accounts to withdraw", async () => {
        // Place some bets, close betting and set a winning number.
        await roulette.betOnOddNumber({ from: secondAccount, value: 10 });
        await roulette.closeBets({ from: firstAccount });
        await roulette.setWinningNumber(6);

        try {
            await roulette.withdrawWinnings({ from: secondAccount});
            assert.fail()
        } catch (error) {
            assert(error.toString().includes('There are no withdrawable winnings.'), error.toString());
        }        
    });

    it("should allow the croupier to destroy the contract", async () => {
        // This tests serves two purposes:
        // 1. It represents the full business flow of the smart contract.
        // 2. Verifies the contract can be destroyed by the croupier.
        
        await roulette.betOnOddNumber({ from: secondAccount, value: 10 });
        await roulette.betOnEvenNumber({ from: thirdAccount, value: 10 });
        await roulette.betOnEvenNumber({ from: fourthAccount, value: 10 });
        await roulette.closeBets({ from: firstAccount });
        await roulette.setWinningNumber(5);
        await roulette.withdrawWinnings({ from: secondAccount});

        let result = await roulette.closeTable({ from: firstAccount});
        
        assert.equal(result.receipt.status, true);
    });
});