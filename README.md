# BitSpeak

<p align="center">
  <img src="assets/logo.png" alt="BitSpeak logo" width="180">
</p>

<p align="center">
  <strong>A lightweight binary encoding and hashing CLI for Node.js.</strong>
</p>

<p align="center">
  Encode, decode, verify, and hash files directly from your terminal.
</p>

---

## Features

- **Binary Encoding** — Encode files into BitSpeak's binary representation.
- **Decoding** — Restore encoded files to their original content.
- **Integrity Verification** — Verify that decoded output matches the original file.
- **SHA-256 Hashing** — Generate hashes for integrity checks.
- **Zero Dependencies** — Built with Node.js and no external packages.
- **CLI-First** — Simple commands designed for terminal workflows.

## Requirements

- Node.js
- Git (optional, for cloning the repository)

## Installation

Clone the repository:

```bash
git clone https://github.com/LattesGit/bitspeak.git
cd bitspeak
```

No external dependencies are required.

## Usage

### Encode a file

```bash
node bitspeak.js --file encode app.js app.bits
```

### Decode a file

```bash
node bitspeak.js --file decode app.bits restored.js
```

### Verify file integrity

```bash
node bitspeak.js verify app.js restored.js
```

### Run the example

```bash
node examples/basic.js
```

## Testing

Run the test suite using Node.js's built-in test runner:

```bash
node --test
```

## Project Structure

```text
bitspeak/
├── bitspeak.js
├── README.md
├── LICENSE
├── .gitignore
├── assets/
│   └── logo.png
├── examples/
│   └── basic.js
└── test/
    └── bitspeak.test.js
```

## Security and Integrity

BitSpeak provides encoding, decoding, and hashing utilities. **Encoding is not encryption** and should not be used to protect sensitive data.

SHA-256 hashes can help verify content integrity, but a hash alone does not establish the authenticity of a file.

## Contributing

Issues, bug reports, and pull requests are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes and run the tests.
4. Open a pull request.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<p align="center">
  Made for the terminal.
</p>
