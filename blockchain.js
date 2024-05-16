const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const crypto = require('crypto');

// Arithmetic Encoding
class ArithmeticEncoder {
    constructor(probabilities) {
        this.probabilities = probabilities;
    }

    encode(data) {
        // Perform arithmetic encoding here
        let low = 0;
        let high = 1;
        let range = 1;
        for (let i = 0; i < data.length; i++) {
            const char = data[i];
            const probability = this.probabilities[char];
            high = low + range * probability;
            low = low + range * this.probabilities[data[i - 1]] || 0;
            range = high - low;
        }
        return ((low + high)/2).toString(8).padEnd(18, 0).substring(2, 18) ; // or high or anything you prefer
    }
}

class Transaction{
    constructor(fromAddress, toAddress, amount){
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
    }

    calculateHash(){
        return SHA256(this.fromAddress + this.toAddress + this.amount).toString();
    }

    signTransaction(signingKey){
        if(signingKey.getPublic('hex') !== this.fromAddress){
            throw new Error("You can not sign transaction for other wallets");
        }
        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
    }

    isValid(){
        if(this.fromAddress === null) return true;

        if(!this.signature || this.signature.length === 0) {
            throw new Error("No signature on transaction")
        }

        const publicKey = ec.keyFromPublic(this.fromAddress, "hex");
        return publicKey.verify(this.calculateHash(), this.signature);
    }
}


class Block {
    constructor(timestamp, transactions, previousHash='') {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.nonce = 0;
        this.hash = this.calculateHash();
        this.merkleRoot = this.calculateMerkleRoot();
    }

    hashFunction(s) {
        var a = 2654435769, b = 2246822519, c = 3266489917, d = 668265263; // Prime numbers
        var h1 = 1779033703 ^ s.length; // Initial hash value (high bits)
        var h2 = 3144134277 ^ (1-s.length); // Initial hash value (low bits)
        var i, charCode;
        
        if (s) {
            for (i = 0; i < s.length; i++) {
                charCode = s.charCodeAt(i);
                h1 = Math.imul(h1 ^ charCode, a); // Equivalent to (h ^ charCode) * a
                h1 = (h1 << 13) | (h1 >>> 19); // Rotate left by 13 bits
                h1 = Math.imul(h1, b); // Equivalent to h * b
                h1 ^= h1 >>> 16; // XOR and shift
                h1 = Math.imul(h1, c); // Equivalent to h * c
                h1 ^= h1 >>> 15; // XOR and shift
                h1 = Math.imul(h1, d); // Equivalent to h * d
                
                h2 = Math.imul(h2 ^ charCode, a); // Equivalent to (h ^ charCode) * a
                h2 = (h2 << 13) | (h2 >>> 19); // Rotate left by 13 bits
                h2 = Math.imul(h2, b); // Equivalent to h * b
                h2 ^= h2 >>> 16; // XOR and shift
                h2 = Math.imul(h2, c); // Equivalent to h * c
                h2 ^= h2 >>> 15; // XOR and shift
                h2 = Math.imul(h2, d); // Equivalent to h * d
            }
        }
        
        // Combine high and low bits to form a 64-bit integer
        var combinedHash = Math.abs(h1).toString(16) + Math.abs(h2).toString(16);
        
        // Convert to 16-digit hex string (64 bits)
        return combinedHash.padStart(16, '0');
    }

    calculateMerkleRoot() {
        // Construct Merkle tree and calculate Merkle root for transactions
        const transactionHashes = this.transactions.slice();

        while (transactionHashes.length > 1) {
            const newHashes = [];
            for (let i = 0; i < transactionHashes.length; i += 2) {
                const left = transactionHashes[i];
                const right = (i + 1 < transactionHashes.length) ? transactionHashes[i + 1] : '';
                const combinedHash = this.hashFunction(left + right);
                newHashes.push(combinedHash);
            }
            transactionHashes.splice(0, transactionHashes.length); // Empty transactionHashes array
            transactionHashes.push(...newHashes); // Replace with new transactionHashes
        }
        return transactionHashes[0]; // Return the Merkle root for transactions
    }

    mixAndHash(hex1, hex2, hex3, hex4) {
        // Mix the hex strings
        var mixedString = "";
        for (var i = 0; i < 16; i++) {
            mixedString += hex1[i] + hex2[i] + hex3[i] + hex4[i];
        }
    
        // Calculate the hash of the mixed string
        var hash = this.hashFunction(mixedString);
    
        return hash;
    }

    calculateHash() {
        const probabilities = this.calculateProbabilities(this.timestamp + JSON.stringify(this.transactions) + this.nonce);
        const encoder = new ArithmeticEncoder(probabilities);
        // Calculate the hash of the block
        const timestampHash = this.hashFunction(this.timestamp.toString());
        const previousHashHash = this.hashFunction(this.previousHash);
        const nonceHash =  this.hashFunction(this.nonce.toString());
        console.log(this.nonce, nonceHash)
        this.merkleRoot = this.calculateMerkleRoot();
        // Concatenate transactions Merkle root with other attribute hashes
        // const combinedData = this.merkleRoot + this.arithmeticEncode(this.timestamp.toString()) + this.arithmeticEncode(this.previousHash) + this.arithmeticEncode(this.nonce.toString());

        // Concatenate and hash individual attribute hashes
        const combinedHash = this.mixAndHash(this.merkleRoot, timestampHash, previousHashHash, nonceHash);
        return combinedHash;
    }

    calculateProbabilities(data) {
        const frequencies = {};
        // Count frequencies of characters
        for (let i = 0; i < data.length; i++) {
            const char = data[i];
            frequencies[char] = (frequencies[char] || 0) + 1;
        }
        // Calculate probabilities
        const totalChars = data.length;
        const probabilities = {};
        for (const char in frequencies) {
            probabilities[char] = frequencies[char] / totalChars;
        }
        return probabilities;
    }

    mineBlock(difficulty){
        while(this.hash.substring(0, difficulty) !== Array(difficulty+1).join("0")){
            this.nonce++;
            this.hash = this.calculateHash();
            console.log(this.nonce, this.hash)
        }
        console.log("Block mined " + this.hash + " " + this.nonce);
    }

    hasValidTransactions(){
        for(const tx of this.transactions){
            if(!tx.isValid){
                return false;
            }
        }
        return true;
    }
}

class Blockchain{
    constructor(){
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 4;
        this.pendingTransactions = [];
        this.miningReward = 100;
    }

    createGenesisBlock(){
        return new Block("01/01/2024", ['transaction1', 'transaction2', 'transaction3', 'transaction4'], "0");
    }

    getLatestBlock(){
        return this.chain[this.chain.length - 1];
    }

    minePendingTransactions(miningrewardAddress){
        let block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);
        console.log("Block mined");
        this.chain.push(block);

        this.pendingTransactions = [new Transaction(null, miningrewardAddress, this.miningReward)]
    }

    addTransaction(transaction){
        if(!transaction.fromAddress || !transaction.toAddress) {
            throw new Error('Transaction must include from and to addresses');
        }
        
        if (!transaction.isValid()) {
            throw new Error("Cannot add invalid transcations to chain")
        }
        this.pendingTransactions.push(transaction);
    }

    getBalanceofAddress(address){
        let balance = 0
        for(const block of this.chain){
            for(const trans of block.transactions){
                if(trans.fromAddress === address){
                    balance -= trans.amount;
                }
                if(trans.toAddress === address){
                    balance  += trans.amount;
                }
            }
        }
        return balance;
    }

    isChainvalid(){
        for(let i = 1; i < this.chain.length; i++){
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i-1];

            if(!currentBlock.hasValidTransactions()){
                return false;  
            }

            if(currentBlock.hash != currentBlock.calculateHash()){
                return false;
            }

            if(currentBlock.previousHash !== previousBlock.hash){
                return false;
            }
        }
        return true;
    }
}


module.exports.Blockchain = Blockchain
module.exports.Block = Block
module.exports.Transaction = Transaction