var Roulette = artifacts.require('./Roulette.sol');

module.exports = function(deployer) {
  // Deploying the smart contract named roulette, with a stake value of 10.
  // The first address in the local etherium network will be used,
  // making the first address as the owner.
  // For learning purposes, we are using this level of granularity
  // to not allow Truffle do a lot of hidden setup on its own.
  deployer.deploy(Roulette, 10, {from:web3.eth.accounts[0]});
};
