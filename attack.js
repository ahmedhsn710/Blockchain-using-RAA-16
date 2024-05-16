function hashFunction(s) {
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

// Example usage:
var hash = hashFunction("hello");
console.log(hash); // Output will be a 16-character hexadecimal string


function generateRandomString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

const hashes = new Map(); // To store hash values and corresponding input strings
const maxAttempts = 100000; // Maximum number of attempts for the brute force attack

let collisionFound = false;

for (let i = 0; i < maxAttempts; i++) {
    const randomString = generateRandomString(10); // Generate a random string of length 10
    const hash = hashFunction(randomString); // Compute its hash
    console.log(hash)

    if (hashes.has(hash)) { // Check if the hash already exists
        console.log("Collision Found:");
        console.log("Hash:", hash);
        console.log("num:", i);
        console.log("Input String 1:", randomString);
        console.log("Input String 2:", hashes.get(hash));
        collisionFound = true;
        break;
    } else {
        hashes.set(hash, randomString); // Add the hash and corresponding input string to the map
    }
}

if (!collisionFound) {
    console.log("No collision found within the maximum attempts.");
}
