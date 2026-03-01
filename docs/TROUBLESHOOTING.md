# Troubleshooting

Common issues and how to fix them.

---

## Import and collections

### "Invalid JSON file" or "Parse error" on import

- The file is not valid JSON. Typical causes:
  - Trailing commas (e.g. `"a": 1,` before `}`).
  - Unquoted keys or single-quoted strings.
  - Truncated or corrupted file.
- **Fix:** Validate the file (e.g. [jsonlint.com](https://jsonlint.com)) or open it in a code editor and fix syntax. Re-export from Postman if needed.

### "Invalid Postman Collection format"

- The JSON is valid but not a Postman Collection v2.x (missing or invalid `info` or `item`).
- **Fix:** In Postman, use **Collection → Export → Collection v2.1** and upload that file.

### "No file provided" or "workspaceId is required"

- The import request is missing the file or workspace.
- **Fix:** Select a workspace first, then choose a single JSON file. If using the UI, use the upload area on Home.

### "File size exceeds 10MB limit"

- The collection file is too large for the default limit.
- **Fix:** Split the collection in Postman or reduce size (e.g. remove unused requests) and re-export.

### "This collection has no requests"

- The imported collection has no requests (only folders or empty).
- **Fix:** In Postman, add at least one request to the collection and re-export.

---

## Variables and execution

### "Missing required variables" (in URL / headers / body)

- One or more placeholders (e.g. `{{api_key}}`) have no value.
- **Fix:**
  - Open **Variable Wallet** and add a variable with the **exact name** (e.g. `api_key`).
  - Or fill the field in the action form before running.
  - Check **scope**: workspace variables apply to all environments; environment variables only when that environment is selected.

### "Please select a workspace first"

- No workspace is selected in the header.
- **Fix:** Select or create a workspace from the dropdown before importing, running actions, or opening Variable Wallet.

### Execution fails with "Request timeout" or "Connection failed"

- The target server didn’t respond in time or the request couldn’t be sent (e.g. network, DNS, invalid URL).
- **Fix:** Check the resolved URL and network. For timeouts, the backend uses a 30s default; the target service may need to be faster or reachable from the machine running the backend.

### Response shows "Response too large, truncated"

- The response body was larger than the stored limit (e.g. 1MB). Only the first part is saved in run history.
- **Fix:** This is expected for very large responses. Full response is still shown in the UI for that run; only the stored copy is truncated.

---

## UI and display

### Variable value shows "••••••" or "(empty)"

- **••••••** – The variable is marked as secret; the value is never shown in the UI (only masked).
- **(empty)** – The variable has no value set. Edit it in Variable Wallet and set a value.

### Long names or URLs are cut off

- Long names (e.g. action names, variable names) are truncated in lists; full text is available in the **tooltip** (hover). Long URLs wrap or break in request/response sections.

### Run History or Action Catalog is slow with many items

- The app uses virtualization for long lists. If it still feels slow, try filtering (e.g. by action or environment) to reduce the number of rows.

---

## Development and API

### Frontend can’t reach the API (CORS or connection refused)

- Backend may not be running, or the frontend is using the wrong API URL.
- **Fix:** Start the backend (`cd backend && npm run dev`). If the API is on another host or port, set `VITE_API_URL` for the frontend (e.g. `http://localhost:3001/api`).

### Backend fails to start (e.g. port in use)

- Another process is using the default port (3001).
- **Fix:** Set `PORT` in backend `.env` to a different port, and set `VITE_API_URL` in the frontend to match.

### Secret variables don’t decrypt after restart

- Secret values are encrypted with a key. If `ENCRYPTION_KEY` is not set, the backend generates a new one at startup and old encrypted values can’t be decrypted.
- **Fix:** Set `ENCRYPTION_KEY` in the backend environment (e.g. in `.env`) to a stable value (e.g. 32-byte hex). Existing secrets may need to be re-entered once after setting the key.

---

For more on setup and limits, see the [README](../README.md). For API details, see [API.md](API.md).
