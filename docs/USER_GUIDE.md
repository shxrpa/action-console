# Action Console – User Guide

This guide walks through the main workflows: importing a collection, configuring variables, running actions, and viewing run history.

---

## 1. Choose a workspace

- Open the app and select a **workspace** in the header (or create one).
- All collections, variables, and run history are scoped to the selected workspace.

---

## 2. Import a Postman collection

1. Go to **Home**.
2. Ensure a workspace is selected.
3. **Click or drag-and-drop** a Postman Collection JSON file (Export from Postman: Collection → Export → Collection v2.1).
4. Wait for the import to finish. You’ll see a success message and then be taken to **Collections**.
5. The new collection appears in the list. Use **View actions** to open the **Action Catalog**.

**Tips:**

- File must be valid JSON and Postman Collection v2.x format.
- Large collections (100+ requests) may take a few seconds to import.
- If you see “Invalid JSON” or “Invalid Postman Collection format”, check the file (e.g. at [jsonlint.com](https://jsonlint.com)).

---

## 3. Configure variables (Variable Wallet)

Many actions need variables (e.g. API keys, base URLs). You can set them in the **Variable Wallet** or when running an action.

1. Open **Variable Wallet** from the sidebar.
2. Select the same **workspace** (and optionally an **environment**).
3. Click **Add Variable** and fill:
   - **Name** – must match the placeholder name in the collection (e.g. `api_key`, `base_url`).
   - **Value** – the actual value.
   - **Scope** – Workspace (shared) or Environment (per environment).
   - **Secret** – check if the value should be masked and stored encrypted.
4. Save. Variables are then available when you run actions in that workspace (and environment, if set).

**Environments:** Use environments (e.g. Sandbox vs Production) to switch variable sets. Create or select an environment in the header or Variable Wallet.

---

## 4. Run an action

1. Go to **Collections** → open a collection → **View actions** to open the **Action Catalog**.
2. Click an **action** (request) to open its detail page.
3. Fill any **required variables** shown in the form (or rely on Variable Wallet defaults).
4. (Optional) Use **Preview** to see the resolved URL and headers without sending the request.
5. Click **Run Action**. The app sends the request and shows:
   - Status and duration
   - Resolved request (method, URL, headers, body)
   - Response (status, headers, body)
6. For JSON responses you can:
   - **Select a value** in the response tree and **Save as variable** to reuse it in other actions or forms.
   - Switch between **Friendly** and **JSON** view.

**Safety:** For write or dangerous actions, the app may ask for confirmation before running.

---

## 5. View run history

1. Open **Run History** from the sidebar.
2. You’ll see a list of past runs (timestamp, action, environment, status, duration).
3. Use **filters** (action, environment, success/failure) and **sort** (timestamp, action, status, duration) as needed.
4. Click **View** on a run to see full details: resolved request, response, and error (if any). You can **Copy request** or **Copy response** and **View raw** for the full payload.

Runs are stored per workspace. Response bodies over 1MB are truncated in storage; the UI will indicate when that happens.

---

## Quick reference

| Goal                    | Where to go                    |
|-------------------------|--------------------------------|
| Import a collection     | Home → upload JSON             |
| Browse actions          | Collections → View actions     |
| Set API keys / variables| Variable Wallet                |
| Run a request           | Action Catalog → open action → Run Action |
| Save a value from response | After run → select value → Save as variable |
| See past runs           | Run History                    |

For setup and troubleshooting, see the main [README](../README.md) and [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
