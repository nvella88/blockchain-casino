# Blockchain Casino

The aim of this project is to simulate an online casino using blockchain technology.

## About the system

A smart contract representing the Roulette game has been developed. The croupier, the owner of the smart contract, opens the table by creating a new instance and setting the table stake on creation. In this scenario, players are allowed to bet on odd or even numbers.

After the winning number is set, the players can check if they have any withdrawable balance and request to withdraw said winnings.


## Usage: Smart Contract
The project has been written in Solidity, using Truffle as a development environment and Ganache as a local RPC server running on the port 8545. The project can be compiled, tested and deployed by opening the CLI at the root folder of the project and executing the commands below.
```bash
truffle compile
truffle test
truffle migrate --reset
```

The `--reset` flag ensures migrations are run from the beginning ([source](https://truffleframework.com/docs/truffle/reference/truffle-commands)).

## Usage: Frontend
The frontend has been written using HTML, Bootstrap 4.0 and jQuery. Bootstrap and jQuery are served using CDNs. An npm package called `lite-server` is used to run the frontend application locally ([source](https://truffleframework.com/tutorials/pet-shop)). With the CLI open in the directory of the project, run the following commands.
```bash
npm install
npm run dev
```
The application should open automatically on [http://localhost:3000/](http://localhost:3000/)