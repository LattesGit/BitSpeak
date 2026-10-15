# BitSpeak

A command line tool for encoding, decoding and inspecting data

BitSpeak works with binary, hex and base64. It can convert text and files, inspect file signatures, calculate SHA256 hashes and compare files.

## Features

- Encode and decode text
- Convert files between binary, hex and base64
- Inspect file size, type and raw bytes
- Calculate SHA256 hashes
- Compare files to check data integrity
- Process multiple files at once
- Show progress during file conversion
- Interactive terminal menu
- No external dependencies

## Requirements

- Node.js

## Usage

### Text

```bash
node bitspeak.js encode "Hello world"
node bitspeak.js encode "Hello" --format hex
node bitspeak.js encode "Hello" --format base64
node bitspeak.js decode "01001000 01101001"
```

### Files

```bash
node bitspeak.js --file encode app.js app.bits
node bitspeak.js --file decode app.bits restored.js
node bitspeak.js --file encode image.png image.b64 --format base64
node bitspeak.js --file decode image.b64 restored.png --format base64
```

Use `--force` to overwrite an existing output file.

### Inspect files

```bash
node bitspeak.js inspect file.bin
```

Displays basic file information, a type estimate, the first bytes and the SHA256 hash.

### Hash files

```bash
node bitspeak.js hash file.bin
```

### Compare files

```bash
node bitspeak.js verify original.bin restored.bin
```

Checks whether both files have the same size and SHA256 hash.

### Batch processing

```bash
node bitspeak.js batch encode ./input ./encoded
node bitspeak.js batch encode ./input ./encoded --recursive --format hex
node bitspeak.js batch decode ./encoded ./restored --recursive
```

Use `--recursive` to include files inside subdirectories.

### Interactive mode

```bash
node bitspeak.js interactive
```

### Help

```bash
node bitspeak.js help
```

## Supported formats

- `binary`
- `hex`
- `base64`

Choose a format with `--format`. Binary is the default.

## Module usage

BitSpeak can also be used in other Node.js projects.

```javascript
const { encode, decode, hash } = require("./bitspeak.js");

const text = "Hello world";
const binary = encode(text);
const restored = decode(binary).toString("utf8");

console.log(binary);
console.log(restored);
console.log(hash(Buffer.from(text)));
```

## License

MIT
