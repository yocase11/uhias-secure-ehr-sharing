# Healthcare EHR System Backend

Express.js backend for the Healthcare EHR system. Handles EHR storage, access control, and doctor-patient consent flow.

## Setup

```bash
# Install dependencies
npm install

# Create .env file (minimal setup for local-only mode)
echo "SUPABASE_URL=" > .env
echo "SUPABASE_KEY=" >> .env
echo "SUPABASE_BUCKET=metadata" >> .env

# Start the server
npm start
```

## API Endpoints

- `POST /upload` - Admin uploads EHR data
- `GET /metadata/:recordId` - View metadata for a record
- `GET /ehr/:recordId` - Download EHR file (requires access)
- `POST /request-access` - Doctor requests access
- `POST /grant-access` - Patient approves access
- `POST /deny-access` - Patient denies access
- `POST /break-glass` - Emergency access for doctors

## Testing

```bash
# Run API tests
npx jest api_full.test.js
```

## Local Storage

EHR files and metadata are stored in `./local_ehr/`:
- `*.ehr` - Encrypted EHR data files
- `*.json` - Metadata files with access control info