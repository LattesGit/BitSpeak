# BitSpeak

<p align="center">
  <img src="assets/logo.png" alt="BitSpeak Logo" width="180">
</p>

<h3 align="center">Speak Binary Think Different</h3>

<p align="center">
  A lightweight binary encoding and file integrity toolkit for Node.js
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Runtime-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Dependencies-Zero-6C63FF?style=for-the-badge" alt="Zero Dependencies">
  <img src="https://img.shields.io/badge/Hash-SHA--256-00A6ED?style=for-the-badge" alt="SHA 256">
  <img src="https://img.shields.io/badge/License-MIT-white?style=for-the-badge" alt="MIT License">
</p>

<p align="center">
  <a href="#why-bitspeak">Why</a> &nbsp;
  <a href="#features">Features</a> &nbsp;
  <a href="#quick-start">Quick Start</a> &nbsp;
  <a href="#command-reference">Commands</a> &nbsp;
  <a href="#security-model">Security</a> &nbsp;
  <a href="#roadmap">Roadmap</a>
</p>

---

## Overview

BitSpeak is a lightweight command line toolkit that encodes decodes verifies and hashes files directly from your terminal

It is built only on native Node.js APIs so there is nothing to install beyond the repository itself

Use it to experiment with binary representations to confirm that a file survived a round trip unchanged or to add a simple integrity step to your own terminal workflows

## Why BitSpeak

- Small enough to read in one sitting so you always know what it does to your files
- No runtime packages so there is no dependency tree to audit or update
- Predictable behavior so the same input always produces the same output
- Honest scope as an encoding and integrity tool and never a replacement for encryption

## Features

| Feature | What it gives you |
| --- | --- |
| Binary Encoding | Convert file contents into the binary representation supported by BitSpeak |
| File Decoding | Restore encoded files and compare the output with the original |
| Integrity Verification | Confirm that a restored file matches its original counterpart |
| SHA 256 Hashing | Generate cryptographic digests for file integrity checks |
| Zero Dependency Architecture | Rely only on native Node.js functionality |
| Terminal First Workflow | Run every operation from a simple command line interface |
| Developer Friendly Design | Keep processing reproducible and easy to script |

## Quick Start

### Requirements

- Node.js 18 or newer so the built in test runner is available
- Git for cloning the repository

### Install

```bash
git clone https://github.com/LattesGit/bitspeak.git
cd bitspeak
```

No external packages are required and no install step follows

### Your first round trip

```bash
node bitspeak.js --file encode app.js app.bits
node bitspeak.js --file decode app.bits restored.js
node bitspeak.js verify app.js restored.js
```

If verification passes the restored file matches the original

## Command Reference

| Command | Purpose |
| --- | --- |
| `node bitspeak.js --file encode <input> <output>` | Encode a file into its binary representation |
| `node bitspeak.js --file decode <input> <output>` | Decode an encoded file back into its original form |
| `node bitspeak.js verify <original> <restored>` | Check that two files have matching content |
| `node examples/basic.js` | Run the bundled example |
| `node --test` | Run the test suite |

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

## How It Works

```text
Original File
     |
     v
BitSpeak Encoder
     |
     v
Binary Representation
     |
     v
BitSpeak Decoder
     |
     v
Restored File
     |
     v
Integrity Verification
```

The encoding format defines how file content is represented and restored

The verification step checks whether the restored output matches the original content

A SHA 256 digest gives you a compact fingerprint that helps detect any change to file contents

## Good To Know

- Encoding is a representation change and not compression so encoded output may be larger than the original
- Always keep your original file until verification has passed
- Compare digests only against a value you obtained from a trusted source

## Security Model

BitSpeak is a file encoding and integrity toolkit and not an encryption system

Encoding does not provide confidentiality

A SHA 256 digest can detect content differences when compared against a trusted digest

A hash alone does not prove who created a file or whether its source is trustworthy

Do not use BitSpeak encoding as a replacement for authenticated encryption or digital signatures

## Project Structure

```text
bitspeak
├── bitspeak.js
├── README.md
├── LICENSE
├── .gitignore
├── assets
│   └── logo.png
├── examples
│   └── basic.js
└── test
    └── bitspeak.test.js
```

| Path | Role |
| --- | --- |
| `bitspeak.js` | Command line entry point |
| `examples` | Runnable usage examples |
| `test` | Tests for the built in Node.js test runner |
| `assets` | Branding and images |

## Development

BitSpeak uses the built in Node.js test runner

Run all tests with

```bash
node --test
```

Before submitting changes confirm the following

- Encoding and decoding preserve file contents exactly
- Invalid inputs are handled correctly
- The test suite passes
- No runtime dependencies were introduced

## Roadmap

These items are potential future improvements and not claims about existing functionality

### Performance

- [ ] Streaming support for large files
- [ ] Progress indicators for long running operations
- [ ] Benchmark suite for performance testing

### Workflow

- [ ] Recursive directory processing
- [ ] Batch encoding and decoding
- [ ] JSON output for automation
- [ ] Configurable output formats

### Quality

- [ ] Improved error messages
- [ ] Cross platform compatibility tests
- [ ] Extended test coverage for malformed inputs
- [ ] Additional integrity verification workflows

### Release

- [ ] Release automation and versioned binaries

## Contributing

Contributions are welcome

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Run the test suite
5. Submit a pull request

Small focused pull requests are easiest to review

## License

BitSpeak is released under the MIT License

See the LICENSE file for the complete license terms

---

<p align="center">
  Built for developers who live in the terminal
</p>

<p align="center">
  <sub>BitSpeak Encode Decode Verify Hash</sub>
</p>
