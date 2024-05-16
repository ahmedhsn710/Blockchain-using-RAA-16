const {Blockchain, Transaction} = require('./blockchain');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const myKey = ec.keyFromPrivate('f9f2c4c47dca9065abdc779947af845490f715b6832eadd81bd18fd6e2bbf954');
const myWalletAddress = myKey.getPublic('hex');

let hahCoin = new Blockchain();

const tx1 = new Transaction(myWalletAddress, 'add2', 10)
tx1.signTransaction(myKey);
hahCoin.addTransaction(tx1)

console.log('\n Starting the miner ...')
hahCoin.minePendingTransactions(myWalletAddress)
hahCoin.minePendingTransactions(myWalletAddress)
console.log('\n Balance of miner ', hahCoin.getBalanceofAddress(myWalletAddress));

console.log("Is chain vaild: " + hahCoin.isChainvalid())
// console.log("Mining Block 1 .......");
// hahCoin.addBlock(new Block(1, "05/04/2024", {amount: 4}));
// console.log("Mining Block 2 .......");
// hahCoin.addBlock(new Block(2, "05/04/2024", {amount: 10}));

// console.log(JSON.stringify(hahCoin, null, 4))
// console.log(hahCoin.isChainvalid()); //

// hahCoin.chain[1].data = {amount : 100};
// hahCoin.chain[1].hash = hahCoin.chain[1].calculatehash()
// console.log(hahCoin.isChainvalid());
