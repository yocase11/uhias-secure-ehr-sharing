# Dataset Description: Synthetic Health Blockchain Dataset

## Overview
This dataset is a synthetic collection of electronic health records (EHRs) designed for testing and validating the UH-IAS healthcare data management system. It simulates real-world healthcare data while ensuring privacy and compliance.

## Structure
- **File Name:** synthetic_health_blockchain_dataset.csv
- **Location:** datasets/
- **Format:** CSV (Comma-Separated Values)
- **Total Records:** 5,000
- **Unique Patients:** 1,000
- **Record Types:** Reports, images, lab results, prescriptions
- **File Sizes:** 100KB to 50MB (simulated for performance testing)

## Fields
| Field Name         | Description                                      |
|-------------------|--------------------------------------------------|
| patient_id        | Unique identifier for each patient                |
| record_id         | Unique identifier for each health record          |
| record_type       | Type of record (report, image, lab, prescription) |
| timestamp         | Date and time of record creation                  |
| provider_id       | Unique identifier for healthcare provider         |
| file_hash         | SHA-256 hash of the encrypted file                |
| file_size         | Size of the file in bytes                         |
| consent_id        | Consent policy identifier                         |
| access_level      | Access level (read, write, emergency)             |
| status            | Record status (active, archived, revoked)         |

## Example Rows
| patient_id | record_id | record_type | timestamp           | provider_id | file_hash         | file_size | consent_id | access_level | status  |
|------------|-----------|-------------|---------------------|-------------|-------------------|-----------|------------|--------------|---------|
| P0001      | R00001    | report      | 2025-10-01 09:15:00 | H001        | 3a7f...e2b1       | 245000    | C001       | read         | active  |
| P0002      | R00002    | image       | 2025-10-01 10:05:00 | H002        | 9b2c...d4f3       | 5120000   | C002       | write        | active  |
| P0003      | R00003    | lab         | 2025-10-01 11:20:00 | H003        | 7c1d...a8e7       | 120000    | C003       | read         | archived|

## Usage
- **Performance Testing:** Simulate uploads, downloads, and access control scenarios.
- **Validation:** Test encryption, consent management, and audit logging.
- **Visualization:** Generate metrics and plots for system evaluation.

## Notes
- All data is synthetic and does not represent real patient information.
- The dataset is designed to cover a wide range of healthcare scenarios, including emergency access and policy changes.
- File sizes and types are varied to test system scalability and performance.

## License
This dataset is for research and educational use only. Redistribution or use with real patient data is not permitted.
