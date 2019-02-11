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
    web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'));
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
  // Payment is done automatically by using the value stored in the App instance.
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

  // Since MetaMask is not being used, we need to set the gas in the code.
  // MetaMask makes automatic estimates on behalf of the user.
  // Player function
  betOnOddNumber: function (accountIndex) {
    App.contracts.Roulette.deployed().then(function (instance) {
      playerAccount = App.accounts[accountIndex];
      return instance.betOnOddNumber({ from: playerAccount, value: App.tableStake, gas: 1400000 })
    }).then(function () {
      alert('Bet has been placed.');
    }).catch(function (error) {
      // Show error to user.
      // This is not a good practice. The error should be processed and the UI updated accordingly.
      alert(error.message);
    });
  },

  // Player function
  betOnEvenNumber: function (accountIndex) {
    App.contracts.Roulette.deployed().then(function (instance) {
      playerAccount = App.accounts[accountIndex];
      return instance.betOnEvenNumber({ from: playerAccount, value: App.tableStake, gas: 1400000 })
    }).then(function () {
      alert('Bet has been placed.');
    }).catch(function (error) {
      alert(error.message);
    });
  },

  // Administrator / croupier function.
  closeBets: function () {
    App.contracts.Roulette.deployed().then(function (instance) {
      return instance.closeBets({ from: App.croupierAccount, gas: 1400000 });
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
      return instance.setWinningNumber(winningNumber, { from: App.croupierAccount, gas: 1400000 });
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
      return instance.getWithdrawableBalance({ from: playerAccount, gas: 1400000 });
    }).then(function (result) {
      alert('Your winnings are: ' + result + ' Wei');
    }).catch(function (error) {
      alert(error.message);
    });
  },

  // Player function
  withdrawWinnings: function (accountIndex) {
    App.contracts.Roulette.deployed().then(function (instance) {
      playerAccount = App.accounts[accountIndex];
      return instance.withdrawWinnings({ from: playerAccount, gas: 1400000 });
    }).then(function () {
      alert('Table closed.');
    }).catch(function (error) {
      alert(error.message);
    });    
  },

  // Croupier function
  closeTable: function () {
    App.contracts.Roulette.deployed().then(function (instance) {
      return instance.closeTable({ from: App.croupierAccount, gas: 1400000 });
    }).then(function () {
      alert('Table closed.');
    }).catch(function (error) {
      alert(error.message);
    });
  },
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
