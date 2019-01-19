const Roulette = artifacts.require("Roulette");

contract("Roulette", accounts => {
    // Truffle deploys the smart contract using the first address by default.
    // This makes the first account the croupier.
    // This scenario is covered in TestRoulette.sol.
    const [firstAccount, secondAccount] = accounts;
    let roulette;

    // Common setup before executing each test.
    beforeEach('setup contract for each test', async function () {
        roulette = await Roulette.new(10)
    })

    it("should return the correct table stake value", async () => {
        var result = await roulette.getTableStake();
        assert(result, 10);
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

    it("should not allow betting when bets are closed", async () => {
        await roulette.closeBets({ from: firstAccount});

        try {
            // Invalid bet: Even
            await roulette.betOnEvenNumber({ from: secondAccount, value: 10 });
            assert.fail()
        } catch (error) {
            assert(error.toString().includes('Betting is not open.'), error.toString());
        }
    });
});