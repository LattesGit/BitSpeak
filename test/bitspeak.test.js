const test = require("node:test");
const assert = require("node:assert/strict");

const { encode, decode, hash } = require("../bitspeak.js");

test("encodes text into binary", () => {
  const result = encode("Hello");
  assert.equal(typeof result, "string");
  assert.ok(result.length > 0);
});

test("decodes encoded text correctly", () => {
  const original = "Hello world";
  const encoded = encode(original);
  const decoded = decode(encoded).toString("utf8");

  assert.equal(decoded, original);
});

test("handles empty text", () => {
  const encoded = encode("");
  const decoded = decode(encoded).toString("utf8");

  assert.equal(decoded, "");
});

test("generates a SHA256 hash", () => {
  const result = hash(Buffer.from("Hello world"));

  assert.match(result, /^[a-f0-9]{64}$/);
});

test("produces consistent hashes", () => {
  const data = Buffer.from("BitSpeak");

  assert.equal(hash(data), hash(data));
});
