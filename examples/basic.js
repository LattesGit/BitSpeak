const { encode, decode, hash } = require("../bitspeak.js");

const text = "Hello world";

const binary = encode(text);
const restored = decode(binary).toString("utf8");

console.log("Text:", text);
console.log("Binary:", binary);
console.log("Restored:", restored);
console.log("SHA256:", hash(Buffer.from(text)));
