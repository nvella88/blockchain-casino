var Roulette = artifacts.require('./Roulette.sol');

module.exports = function(deployer) {
  // Deploying the smart contract named roulette, with a stake value of 10.
  // The first address in the local etherium network will be used,
  // making the first address as the owner.
  deployer.deploy(Roulette, 10, {from:web3.eth.accounts[0]});
};
