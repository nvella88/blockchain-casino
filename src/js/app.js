App = {
  web3Provider: null,
  contracts: {},
  // The addresses on the network will be retrieved once.
  // This setup will make use of more then one address.
  accounts: null,
  // Croupier account (accounts[0]) will be assigned to a variable. It will be easier to follow.
  // The rest of the accounts will be read from the array, accounts[1], and so on.
  croupierAccount: null,
  tableStake: 0,

  init: async function () {
    return await App.initWeb3();
  },

  initWeb3: async function () {
    // For the purposes of this prototype, Metamask will not be used.
    // A more realistic scenario would be to load Metamask and connect it to the Etherium network of choice.
    // In this case the development network will always be used.
    // Reference: https://truffleframework.com/tutorials/pet-shop
    web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545'));    
    return App.initContract();
  },

  initContract: function () {
    $.getJSON('Roulette.json', function (data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var RouletteArtifact = data;
      App.contracts.Roulette = TruffleContract(RouletteArtifact);
      // Set the provider for our contract
      App.contracts.Roulette.setProvider(web3.currentProvider);

      return App.loadAccounts();
    });    
  },

  // Get accounts and assign the values to this instance.
  loadAccounts: function () {
    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      App.accounts = accounts;
      App.croupierAccount = App.accounts[0];
    });

    return App.getTableStake();
  },

  // Get table stake and show on page.
  // Payment is done automatically too in this way.
  getTableStake: function () {
    App.contracts.Roulette.deployed().then(function (instance) {
      return instance.getTableStake({ from: App.croupierAccount });
    }).then(function (result) {
      App.tableStake = result;
      document.getElementById('table-stake').innerHTML = App.tableStake;
    }).catch(function (error) {
      console.log(error.message);
    });
  },

  // Player function
  betOnOddNumber: function (accountIndex) {
    App.contracts.Roulette.deployed().then(function (instance) {
      playerAccount = App.accounts[accountIndex];
      return instance.betOnOddNumber({ from: playerAccount, value: App.tableStake })
    }).then(function () {
      alert('Bet has been placed.');
    }).catch(function (error) {
      alert('Something went wrong.');
      console.log(error.message);
    });
  },

  // Player function
  betOnEvenNumber: function (accountIndex) {
    App.contracts.Roulette.deployed().then(function (instance) {
      playerAccount = App.accounts[accountIndex];
      return instance.betOnEvenNumber({ from: playerAccount, value: App.tableStake })
    }).then(function () {
      alert('Bet has been placed.');
    }).catch(function (error) {
      alert('Something went wrong.');
      console.log(error.message);
    });
  },

  // Administrator / croupier function.
  // When functions must be called by the croupier, 
  // the error message can be shown using alert.
  closeBets: function () {
    App.contracts.Roulette.deployed().then(function (instance) {
      return instance.closeBets({ from: App.croupierAccount });
    }).then(function () {
      alert('Table has been closed for betting.');
    }).catch(function (error) {
      alert(error.message);
    });
  },

  // Croupier function
  setWinningNumber: function () {
    App.contracts.Roulette.deployed().then(function (instance) {
      var winningNumber = document.getElementById('winning-number').value;
      return instance.closeBets(winningNumber, { from: App.croupierAccount });
    }).then(function () {
      alert('Winning number has been set.');
    }).catch(function (error) {
      alert(error.message);
    });
  },

  // Player function
  getWithdrawableBalance: function (accountIndex) {
    App.contracts.Roulette.deployed().then(function (instance) {
      playerAccount = App.accounts[accountIndex];
      return instance.closeBets(winningNumber, { from: playerAccount });
    }).then(function (result) {
      alert('Your winnings are: ' + result);
    }).catch(function (error) {
      alert('Something went wrong.');
      console.log(error.message);
    });
  },

  // Player function
  withdrawWinnings: function (accountIndex) {
    App.contracts.Roulette.deployed().then(function (instance) {
      playerAccount = App.accounts[accountIndex];
      return instance.withdrawWinnings(winningNumber, { from: playerAccount });
    }).then(function (result) {
      alert('Your winnings are: ' + result);
    }).catch(function (error) {
      alert('Something went wrong.');
      console.log(error.message);
    });
  }
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
