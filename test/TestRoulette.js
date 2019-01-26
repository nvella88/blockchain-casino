const Roulette = artifacts.require("Roulette");

contract("Roulette", accounts => {
    // Truffle deploys the smart contract using the first address by default.
    // This makes the first account the croupier.
    // This scenario is covered in TestRoulette.sol.
    const [firstAccount, secondAccount, thirdAccount, fourthAccount] = accounts;
    let roulette;

    // Common setup before executing each test.
    beforeEach('setup contract for each test', async function () {
        roulette = await Roulette.new(10)
    })

    it("should return the correct table stake value", async () => {
        var result = await roulette.getTableStake();
        assert(result, 10);
    });

    it("should not create a session if a player has never placed a bet", async () => {
        var result = await roulette.isPlayerSessionCreated(secondAccount, { from: firstAccount });
        assert(result === false);
    });

    it("should create a session if a user placed a bet", async () => {
        await roulette.betOnOddNumber({ from: secondAccount, value: 10 });
        var result = await roulette.isPlayerSessionCreated(secondAccount, { from: firstAccount });
        assert(result === true);
    });

    // Bet placement logic, that is, testing requires.
    // Source: https://medium.com/@gus_tavo_guim/testing-your-smart-contracts-with-javascript-40d4edc2abed
    it("should not allow croupier to place a bet", async () => {
        try {
            await roulette.betOnOddNumber({ from: firstAccount, value: 10 });
            assert.fail()
        } catch (error) {
            assert(error.toString().includes('The house is not allowed to bet.'), error.toString())
        }
    });

    it("should not allow bets which do not match stake", async () => {
        try {
            await roulette.betOnOddNumber({ from: secondAccount, value: 11 });
            assert.fail()
        } catch (error) {
            assert(error.toString().includes('Must match the table stake.'), error.toString());
        }
    });

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

    it("should set the winning number correctly", async () => {
        await roulette.closeBets({ from: firstAccount });
        await roulette.setWinningNumber(5);

        var winningNumber = roulette.getWinningNumber();
        assert(winningNumber, 5);

    });

    it("should not set the winning number if bets are allowed", async () => {
        try {
            await roulette.setWinningNumber(5);
            assert.fail()
        } catch (error) {
            assert(error.toString().includes('The table must be closed for betting.'), error.toString());
        }
    });

    it("should not set the winning number if input is invalid", async () => {
        await roulette.closeBets({ from: firstAccount });
        try {
            await roulette.setWinningNumber(40);
            assert.fail()
        } catch (error) {
            assert(error.toString().includes('A valid roulette number is required.'), error.toString());
        }
    });

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

    it("should allow winning accounts to withdraw", async () => {
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
});