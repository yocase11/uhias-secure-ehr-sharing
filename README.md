# UH-IAS — Unified Health Identity & Access System (Prototype)

This repository contains a prototype implementation and documentation for UH‑IAS: a consent-driven, SSI-enabled, blockchain-backed Electronic Health Record (EHR) sharing system. The prototype is intended for research and demonstration; it is not production-ready.

Table of contents
- Project overview
- Deliverables / Files
- Prerequisites
- Recommended setup (Hardhat v2 toolchain)
- Quick start (clone, install, run)
- Smart contract (Consent.sol) — code outline
- Deployment (Hardhat scripts)
- Backend (Node.js) — endpoints and snippets
- IPFS integration
- Crypto utilities (AES + RSA hybrid)
- Frontend (React) skeleton
- Synthetic dataset (CSV)
- Running the demo scenario
- Testing & evaluation scripts
- Results, plots and where to find them
- References (APA)
- Notes, security, and next steps

---

## 1. Project overview

UH‑IAS demonstrates a privacy-preserving, patient-centric architecture for sharing medical records. Key ideas:

* Self‑Sovereign Identity (DIDs) for patients and providers
* Off‑chain encrypted storage for large EHR files (IPFS / cloud)
* On‑chain metadata & consent pointers (permissioned Ethereum)
* Smart contracts for consent management and audit logging
* Emergency "break‑glass" flow with multi‑signature authorization

This README explains how to run a local prototype and reproduce experiments.

---

## 2. Deliverables / Files

Suggested repository layout:

```
uh-ias/
├─ contracts/
│  └─ Consent.sol
├─ scripts/
│  └─ deploy.ts
├─ backend/
│  ├─ server.js
│  ├─ ipfs.js
│  └─ crypto_utils.js
├─ frontend/
│  └─ (React app skeleton)
├─ datasets/
│  └─ synthetic_health_blockchain_dataset.csv
├─ tests/
│  └─ consent.test.ts
├─ hardhat.config.ts
├─ package.json
└─ README.md
```

Files in this prototype include contract code, deployment scripts, a Node.js backend for IPFS and crypto, a React frontend skeleton, unit tests, a synthetic dataset for experiments, and analysis artifacts.

---

## 3. Prerequisites

Install these tools locally:



```powershell
# initialize project (if not already)
npm init -y


# runtime deps for backend & frontend
npm install express ethers ipfs-http-client axios dotenv

If you prefer Hardhat v3, you can adapt the instructions but expect to install plugins individually.


# install dependencies
# compile contracts

# start a local node in a new terminal
npx hardhat node

cd backend; node server.js

# start frontend (separately - React app)
cd frontend; npm install; npm start
```

---

## 6. Smart contract (Consent.sol) — code outline

Below is a minimal consent + audit contract to record metadata and log access events. The prototype keeps policy evaluation off‑chain.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract UH_Consent {
    struct Policy { address owner; string policyHash; uint256 expiry; bool exists; }
    struct RecordMeta { address uploader; string cid; string hash; uint256 timestamp; string policyId; }
    struct Audit { address requester; string recordCid; uint256 timestamp; bool granted; string reason; }

    mapping(string => Policy) public policies;
    mapping(string => RecordMeta) public records;
    Audit[] public audits;
    event PolicyCreated(string policyId, address owner);
    event AccessLogged(address requester, string recordCid, bool granted, string reason);

    function setPolicy(string calldata policyId, string calldata policyHash, uint256 expiry) external {
        policies[policyId] = Policy({ owner: msg.sender, policyHash: policyHash, expiry: expiry, exists: true });
        emit PolicyCreated(policyId, msg.sender);
    }
        emit RecordRegistered(recordId, cid);
    }
    function getAuditCount() external view returns (uint256) { return audits.length; }
}
Notes: ABAC evaluation and more detailed consent logic are implemented off‑chain in the backend prototype for flexibility.

---
## 7. Deployment (Hardhat scripts)

Create `scripts/deploy.ts` using ethers/hardhat runtime. Example:

```ts
import { ethers } from "hardhat";
  const Consent = await ethers.getContractFactory("UH_Consent");
  const consent = await Consent.deploy();
  await consent.deployed();
  console.log("Consent deployed to:", consent.address);
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
```

Run with:

```powershell
npx hardhat run scripts/deploy.ts --network localhost
```

---

## 8. Backend (Node.js) — endpoints and snippets

The backend handles encryption, IPFS upload, and contract calls. Minimal endpoints:
* POST /upload — upload file (base64), AES encrypt, store encrypted blob to IPFS, compute SHA‑256, call `registerRecord`.
* POST /policy — patient sends signed policy; compute hash, call `setPolicy`.
* POST /request-access — provider requests access; backend evaluates ABAC off‑chain and calls `logAccess`.

Minimal `server.js` snippet:
app.use(express.json({ limit: '50mb' }));

  const { encrypted, key, iv, tag } = aesEncrypt(buffer);
  const cid = await uploadBuffer(encrypted);
  const fileHash = sha256(encrypted);
  const tx = await consentContract.registerRecord(recordId, cid, fileHash, policyId);
  await tx.wait();
  res.json({ cid, fileHash });
});
```

Important demo note: Do not return raw AES keys in production. Encrypt the AES key to the recipient's public key.

---

## 9. IPFS integration

Use Infura or Web3.Storage, or a local IPFS node. Example using `ipfs-http-client`:

```js
const { create } = require('ipfs-http-client');
const ipfs = create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });
async function uploadBuffer(buf) { const result = await ipfs.add(buf); return result.path; }
```

---

## 10. Crypto utilities (AES + RSA hybrid)

File encryption flow:

1. Generate AES‑256 key + IV → encrypt file with AES‑GCM.
2. Compute SHA‑256 of encrypted file.
3. Encrypt AES key with recipient's RSA public key (RSA‑OAEP).
Provide `crypto_utils.js` in `backend/` with helpers for AES‑GCM, key wrapping (RSA), and hashing.

---
Key components:
* `Register.jsx` — generate/import DID (or use MetaMask)
* `Upload.jsx` — file upload UI, calls `/upload`
* `Consent.jsx` — create/edit consent, sign with wallet, call `/policy`
Use `ethers.js` in frontend to sign messages and interact with the deployed contract.
---

## 12. Synthetic dataset (CSV)

Note: dataset available at `/mnt/data/synthetic_health_blockchain_dataset.csv` in the environment used for analysis.


## 13. Running the demo scenario

1. Start Hardhat node
2. Deploy contracts
3. Start backend
4. Upload a sample record (base64 file) to `/upload`
5. Create a policy via `/policy`
6. Simulate a provider request to `/request-access` and observe `AccessLogged` events on‑chain
7. Trigger emergency flow via `/request-emergency` (example multi‑sig flow)

---
## 14. Testing & evaluation scripts

* `tests/consent.test.ts` — unit tests (mocha/chai + ethers)
* `benchmarks/latency_test.js` — measure latency across N samples
* `analysis/plot_results.ipynb` — notebook to generate 20+ plots from CSV
---

## 15. Results, plots and where to find them

Detailed validation results, performance metrics, and machine learning model analysis can be found in `docs/VALIDATION_AND_RESULTS.md`. This document includes:

* Performance metrics and system validation
* Machine learning model evaluation
* Detailed results analysis and interpretation
* Visualization metrics and plots

---

## 16. References (sample APA entries)

Madine, M. M., Battah, A. A., Yaqoob, I., Salah, K., Jayaraman, R., Al‑Hammadi, Y., Pesic, S., & Ellahham, S. (2020). Blockchain for giving patients control over their medical records. IEEE Access, 8, 193102–193115. https://doi.org/10.1109/ACCESS.2020.3032075

Saidi, H., Labraoui, N., Abba Ari, A. A., Maglaras, L. A., & Mboussam Emati, J. H. (2022). DSMAC: Privacy‑aware decentralized self‑management of data access control based on blockchain for health data. IEEE Access, 10, 101011–101028. https://doi.org/10.1109/ACCESS.2022.3195271

Azaria, A., Ekblaw, A., Vieira, T., & Lippman, A. (2016). MedRec: Using blockchain for medical data access and permission management. In 2016 2nd International Conference on Open and Big Data (OBD) (pp. 25–30). IEEE. https://doi.org/10.1109/OBD.2016.11

Add the remaining references as you finalise the literature review.

---

## 17. Notes, security, and next steps

This prototype is educational. For production, implement:

* HSM / KMS for key management
* Secure DID wallets and enterprise-grade key management
* Formal verification for smart contracts
* Legal review for cross‑border sharing

Consider integrating Veramo / Hyperledger Indy / Aries for mature SSI flows, and evaluate permissioned chains (Hyperledger Fabric, Corda) for enterprise use.

---

## Appendix: Useful commands

```powershell
# compile
npx hardhat compile

# run local node
npx hardhat node

# deploy contracts
npx hardhat run scripts/deploy.ts --network localhost

# run backend
cd backend; node server.js

# run tests
npx hardhat test
```

---

If you want, I can:

- scaffold the repository files (contracts, scripts, backend, frontend skeleton) and add basic unit tests
- implement the `backend/crypto_utils.js` AES‑GCM + RSA‑OAEP helpers and `backend/ipfs.js` integration
- create a minimal React frontend with the upload and consent flows wired to the backend
- generate the synthetic dataset CSV (sample rows) and an analysis notebook to produce the 20 plots

Tell me which of the above you'd like me to implement next; I can scaffold files and run quick tests.
