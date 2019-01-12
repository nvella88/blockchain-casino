pragma solidity ^0.4.17;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Roulette.sol";

contract TestRoulette {
  // The address of the roulette contract to be tested
  // Roulette roulette = Roulette(DeployedAddresses.Roulette());

  // Testing the croupier is the creator the contract.
  // Reference https://michalzalecki.com/ethereum-test-driven-introduction-to-solidity/
  function testCreatorIsTheCroupier() public {
    Roulette roulette = new Roulette(10);
    Assert.equal(roulette.croupier(), this, "The deployer and croupier do not match.");
  }

  // Testing the croupier is the creator a deployed contract.
  // Reference https://michalzalecki.com/ethereum-test-driven-introduction-to-solidity/
  function testCreatorIsTheCroupierForADeployedContract() public {
    Roulette roulette = Roulette(DeployedAddresses.Roulette());
    Assert.equal(roulette.croupier(), msg.sender, "The deployer and croupier do not match.");
  }
}
