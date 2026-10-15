#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const readline = require("node:readline");
const { Transform } = require("node:stream");
const { pipeline } = require("node:stream/promises");

const formats = ["binary", "hex", "base64"];

function getFormat(value = "binary") {
  const aliases = { bin: "binary", b64: "base64" };
  const format = aliases[value.toLowerCase()] || value.toLowerCase();

  if (!formats.includes(format)) {
    throw new Error("Use binary, hex or base64");
  }

  return format;
}

function encode(data, format = "binary") {
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  format = getFormat(format);

  if (format === "hex") return buffer.toString("hex");
  if (format === "base64") return buffer.toString("base64");

  return Array.from(buffer, byte =>
    byte.toString(2).padStart(8, "0")
  ).join(" ");
}

function decode(data, format = "binary") {
  const input = String(data).trim();
  format = getFormat(format);

  if (format === "hex") {
    const value = input.replace(/\s/g, "");

    if (value.length % 2 || !/^[0-9a-f]*$/i.test(value)) {
      throw new Error("Invalid hex data");
    }

    return Buffer.from(value, "hex");
  }

  if (format === "base64") {
    const value = input.replace(/\s/g, "");

    if (
      value.length % 4 ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)
    ) {
      throw new Error("Invalid base64 data");
    }

    return Buffer.from(value, "base64");
  }

  if (!/^[01\s]*$/.test(input)) {
    throw new Error("Binary data can only contain 0 and 1");
  }

  const bits = input.replace(/\s/g, "");

  if (bits.length % 8) {
    throw new Error("Binary length must be a multiple of 8");
  }

  const output = Buffer.alloc(bits.length / 8);

  for (let i = 0; i < output.length; i++) {
    output[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }

  return output;
}

function hash(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function hashFile(file) {
  return new Promise((resolve, reject) => {
    const result = crypto.createHash("sha256");
    const stream = fs.createReadStream(file);

    stream.on("data", chunk => result.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(result.digest("hex")));
  });
}

function formatSize(size) {
  if (size < 1024) return `${size} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let value = size / 1024;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index++;
  }

  return `${value.toFixed(2)} ${units[index]}`;
}

function identifyFile(data) {
  const signatures = [
    [[0x89, 0x50, 0x4e, 0x47], "PNG image"],
    [[0xff, 0xd8, 0xff], "JPEG image"],
    [[0x47, 0x49, 0x46, 0x38], "GIF image"],
    [[0x25, 0x50, 0x44, 0x46], "PDF document"],
    [[0x50, 0x4b, 0x03, 0x04], "ZIP archive"],
    [[0x1f, 0x8b], "GZIP archive"],
    [[0x7f, 0x45, 0x4c, 0x46], "ELF executable"],
    [[0x4d, 0x5a], "Windows executable"],
    [
      Array.from(Buffer.from("SQLite format 3\0")),
      "SQLite database"
    ]
  ];

  for (const [signature, name] of signatures) {
    if (signature.every((byte, index) => data[index] === byte)) {
      return name;
    }
  }

  if (!data.length) return "Empty file";
  if (data.includes(0)) return "Unknown binary data";

  try {
    new TextDecoder("utf-8", { fatal: true }).decode(data);
    return "Possible UTF-8 text";
  } catch {
    return "Unknown binary data";
  }
}

async function inspect(file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    throw new Error(`File not found: ${file}`);
  }

  const stat = fs.statSync(file);
  const handle = await fs.promises.open(file, "r");
  const head = Buffer.alloc(Math.min(64, stat.size));

  try {
    await handle.read(head, 0, head.length, 0);
  } finally {
    await handle.close();
  }

  console.log(`File       : ${file}`);
  console.log(`Size       : ${stat.size} bytes (${formatSize(stat.size)})`);
  console.log(`Type       : ${identifyFile(head)}`);
  console.log(`SHA-256    : ${await hashFile(file)}`);
  console.log(`First bytes: ${head.toString("hex").match(/.{1,2}/g)?.join(" ") || "(empty)"}`);
}

async function verify(fileA, fileB) {
  if (
    !fs.existsSync(fileA) ||
    !fs.existsSync(fileB) ||
    !fs.statSync(fileA).isFile() ||
    !fs.statSync(fileB).isFile()
  ) {
    throw new Error("Both input files must exist");
  }

  const [hashA, hashB] = await Promise.all([
    hashFile(fileA),
    hashFile(fileB)
  ]);

  const sameSize = fs.statSync(fileA).size === fs.statSync(fileB).size;
  const sameHash = hashA === hashB;

  console.log(`File A: ${hashA}`);
  console.log(`File B: ${hashB}`);

  if (sameSize && sameHash) {
    console.log("PASS: Files are identical");
  } else {
    console.log("FAIL: Files are different");
    process.exitCode = 2;
  }
}

function showProgress(done, total) {
  const percent = total ? Math.floor((done / total) * 100) : 100;
  const width = 24;
  const filled = Math.round((width * percent) / 100);

  process.stderr.write(
    `\r[${"=".repeat(filled)}${" ".repeat(width - filled)}] ${percent}% ${formatSize(done)} / ${formatSize(total)}`
  );

  if (done >= total) process.stderr.write("\n");
}

function encodeStream(format, update) {
  format = getFormat(format);

  let first = true;
  let carry = Buffer.alloc(0);

  return new Transform({
    transform(chunk, enc, callback) {
      try {
        let output = "";

        if (format === "binary") {
          output = Array.from(chunk, byte =>
            byte.toString(2).padStart(8, "0")
          ).join(" ");

          if (!first && output) output = " " + output;
          first = false;
        } else if (format === "hex") {
          output = chunk.toString("hex");
        } else {
          carry = Buffer.concat([carry, chunk]);

          const usable = carry.length - (carry.length % 3);
          output = carry.subarray(0, usable).toString("base64");
          carry = carry.subarray(usable);
        }

        if (output) this.push(output);
        update(chunk.length);
        callback();
      } catch (error) {
        callback(error);
      }
    },

    flush(callback) {
      if (format === "base64" && carry.length) {
        this.push(carry.toString("base64"));
      }

      callback();
    }
  });
}

function decodeStream(format, update) {
  format = getFormat(format);

  let carry = "";
  let pending = "";

  return new Transform({
    transform(chunk, enc, callback) {
      try {
        const text = carry + chunk.toString("utf8");

        if (format === "binary") {
          if (!/^[01\s]*$/.test(text)) {
            throw new Error("Invalid binary data");
          }

          const bits = pending + text.replace(/\s/g, "");
          const usable = bits.length - (bits.length % 8);

          pending = bits.slice(usable);
          const ready = bits.slice(0, usable);
          const output = Buffer.alloc(ready.length / 8);

          for (let i = 0; i < output.length; i++) {
            output[i] = parseInt(ready.slice(i * 8, i * 8 + 8), 2);
          }

          if (output.length) this.push(output);
        } else if (format === "hex") {
          const value = text.replace(/\s/g, "");
          const usable = value.length - (value.length % 2);

          carry = value.slice(usable);
          const ready = value.slice(0, usable);

          if (!/^[0-9a-f]*$/i.test(ready)) {
            throw new Error("Invalid hex data");
          }

          if (ready) this.push(Buffer.from(ready, "hex"));
        } else {
          const value = text.replace(/\s/g, "");
          const usable = value.length - (value.length % 4);

          carry = value.slice(usable);
          const ready = value.slice(0, usable);

          if (ready && !/^[A-Za-z0-9+/]+={0,2}$/.test(ready)) {
            throw new Error("Invalid base64 data");
          }

          if (ready) this.push(Buffer.from(ready, "base64"));
        }

        update(chunk.length);
        callback();
      } catch (error) {
        callback(error);
      }
    },

    flush(callback) {
      if (format === "binary" && pending.length) {
        return callback(new Error("Binary length must be a multiple of 8"));
      }

      if (format === "hex" && carry.length) {
        return callback(new Error("Hex length must be even"));
      }

      if (format === "base64" && carry.length) {
        return callback(new Error("Invalid base64 length"));
      }

      callback();
    }
  });
}

async function convertFile(mode, input, output, options = {}) {
  if (!input || !output) {
    throw new Error("Input and output files are required");
  }

  const source = path.resolve(input);
  const target = path.resolve(output);

  if (source === target) {
    throw new Error("Input and output must be different files");
  }

  if (!fs.existsSync(source) || !fs.statSync(source).isFile()) {
    throw new Error(`Input file not found: ${input}`);
  }

  if (fs.existsSync(target) && !options.force) {
    throw new Error("Output file already exists. Use --force to overwrite it");
  }

  const format = getFormat(options.format);
  const total = fs.statSync(source).size;
  let done = 0;

  const update = size => {
    done += size;
    if (!options.quiet) showProgress(done, total);
  };

  const transform = mode === "encode"
    ? encodeStream(format, update)
    : decodeStream(format, update);

  await pipeline(
    fs.createReadStream(source),
    transform,
    fs.createWriteStream(target, {
      flags: options.force ? "w" : "wx"
    })
  );

  console.log(`Done: ${mode}`);
  console.log(`Input : ${input} (${formatSize(total)})`);
  console.log(`Output: ${output} (${formatSize(fs.statSync(target).size)})`);
  console.log(`SHA-256: ${await hashFile(target)}`);
}

async function batch(mode, input, output, options = {}) {
  if (!input || !output) {
    throw new Error("Input and output paths are required");
  }

  const source = path.resolve(input);
  const target = path.resolve(output);

  if (!fs.existsSync(source)) {
    throw new Error(`Input path not found: ${input}`);
  }

  const files = [];

  async function walk(dir) {
    for (const item of await fs.promises.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, item.name);

      if (item.isFile()) files.push(full);
      else if (item.isDirectory() && options.recursive) await walk(full);
    }
  }

  if (fs.statSync(source).isFile()) {
    files.push(source);
  } else {
    await walk(source);
  }

  if (!files.length) {
    throw new Error("No files found");
  }

  await fs.promises.mkdir(target, { recursive: true });

  let success = 0;
  let failed = 0;

  for (const file of files) {
    const relative = fs.statSync(source).isFile()
      ? path.basename(file)
      : path.relative(source, file);

    const suffix = options.format === "hex"
      ? ".hex"
      : options.format === "base64"
        ? ".b64"
        : ".bits";

    const destination = mode === "encode"
      ? path.join(target, relative + suffix)
      : path.join(target, relative.replace(/\.(bits|hex|b64)$/i, ""));

    try {
      await fs.promises.mkdir(path.dirname(destination), { recursive: true });

      await convertFile(mode, file, destination, {
        ...options,
        quiet: true
      });

      console.log(`OK ${file} -> ${destination}`);
      success++;
    } catch (error) {
      console.error(`FAIL ${file}: ${error.message}`);
      failed++;
    }
  }

  console.log(`Finished: ${success} successful, ${failed} failed`);

  if (failed) process.exitCode = 2;
}

function showHelp() {
  console.log(`
BitSpeak

Text:
  node bitspeak.js encode "Hello world"
  node bitspeak.js encode "Hello" --format hex
  node bitspeak.js encode "Hello" --format base64
  node bitspeak.js decode "01001000 01101001"

Files:
  node bitspeak.js --file encode app.js app.bits
  node bitspeak.js --file decode app.bits restored.js
  node bitspeak.js --file encode image.png image.b64 --format base64
  node bitspeak.js --file decode image.b64 restored.png --format base64

  Use --force to overwrite an existing output file.

Inspect:
  node bitspeak.js inspect file.bin
  node bitspeak.js hash file.bin
  node bitspeak.js verify original.bin restored.bin

Batch:
  node bitspeak.js batch encode ./input ./encoded
  node bitspeak.js batch encode ./input ./encoded --recursive --format hex
  node bitspeak.js batch decode ./encoded ./restored --recursive

Other:
  node bitspeak.js interactive
  node bitspeak.js help

Formats: binary, hex, base64
Encoding is not encryption.
`);
}

function getOption(args, name, fallback) {
  const index = args.indexOf(name);

  if (index === -1) return fallback;
  if (!args[index + 1]) throw new Error(`Missing value for ${name}`);

  return args[index + 1];
}

async function interactive() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = question =>
    new Promise(resolve => rl.question(question, resolve));

  try {
    console.log("\nBitSpeak");
    console.log("1) Encode text");
    console.log("2) Decode text");
    console.log("3) Inspect file");
    console.log("4) Compare files");
    console.log("5) Encode file");
    console.log("6) Decode file");
    console.log("7) Help");

    const choice = (await ask("\nChoose > ")).trim();

    if (choice === "1") {
      const text = await ask("Text > ");
      const format = getFormat((await ask("Format [binary/hex/base64] > ")).trim() || "binary");
      console.log(encode(text, format));
    } else if (choice === "2") {
      const format = getFormat((await ask("Format [binary/hex/base64] > ")).trim() || "binary");
      const data = await ask("Data > ");
      console.log(decode(data, format).toString("utf8"));
    } else if (choice === "3") {
      await inspect(await ask("File > "));
    } else if (choice === "4") {
      await verify(await ask("Original file > "), await ask("Other file > "));
    } else if (choice === "5" || choice === "6") {
      const input = await ask("Input file > ");
      const output = await ask("Output file > ");
      const format = getFormat((await ask("Format [binary/hex/base64] > ")).trim() || "binary");

      await convertFile(choice === "5" ? "encode" : "decode", input, output, {
        format
      });
    } else {
      showHelp();
    }
  } finally {
    rl.close();
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (!args.length || ["help", "--help", "-h"].includes(args[0])) {
    return showHelp();
  }

  if (args[0] === "interactive" || args[0] === "i") {
    return interactive();
  }

  if (["encode", "decode"].includes(args[0])) {
    const mode = args[0];
    const format = getFormat(getOption(args, "--format", "binary"));

    const textArgs = args.slice(1).filter((value, index, all) =>
      value !== "--format" && all[index - 1] !== "--format"
    );

    const text = textArgs.join(" ");

    if (mode === "encode") {
      console.log(encode(text, format));
    } else {
      console.log(decode(text, format).toString("utf8"));
    }

    return;
  }

  if (args[0] === "--file") {
    const [, mode, input, output, ...rest] = args;

    if (!["encode", "decode"].includes(mode)) {
      throw new Error('Use "encode" or "decode" after --file');
    }

    return convertFile(mode, input, output, {
      format: getOption(rest, "--format", "binary"),
      force: rest.includes("--force")
    });
  }

  if (args[0] === "inspect") {
    if (!args[1]) throw new Error("Specify a file");
    return inspect(args[1]);
  }

  if (args[0] === "hash") {
    if (!args[1]) throw new Error("Specify a file");
    console.log(await hashFile(args[1]));
    return;
  }

  if (args[0] === "verify") {
    if (!args[1] || !args[2]) throw new Error("Specify two files");
    return verify(args[1], args[2]);
  }

  if (args[0] === "batch") {
    const [, mode, input, output, ...rest] = args;

    if (!["encode", "decode"].includes(mode)) {
      throw new Error('Use "encode" or "decode" after batch');
    }

    return batch(mode, input, output, {
      format: getOption(rest, "--format", "binary"),
      recursive: rest.includes("--recursive"),
      force: rest.includes("--force")
    });
  }

  throw new Error(`Unknown command: ${args[0]}. Run node bitspeak.js help`);
}

module.exports = {
  encode,
  decode,
  hash,
  hashFile,
  identifyFile
};

if (require.main === module) {
  main().catch(error => {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  });
}
