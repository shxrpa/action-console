# Action Console MVP - Specification

**Linear Story:** [SHX-206](https://linear.app/shxrpa/issue/SHX-206)

**Project:** Action Console  
**Status:** MVP - Requirements Definition

---

## Overview

Action Console is a web application that transforms Postman collections into a safe, plain-English user interface for executing API actions. The MVP enables non-developers to run API requests without needing Postman expertise or understanding HTTP details.

---

## Requirements

### A. Collection Import & Storage

**Requirements:**
- Import a Postman collection via JSON file upload
- Support Postman Collection v2.1 format (minimum)
- Persist the following data:
  - Collection metadata (name, description)
  - Complete folder structure and hierarchy
  - All request definitions (method, URL, headers, body)
  - Request groupings and organization

**Non-goals:**
- Postman API integration (no sync with Postman Cloud)
- Support for Postman Collection v1.0 format
- Real-time collection updates
- Multiple collection versions/history

---

### B. Collection Analysis Engine

**Requirements:**
- Parse every request in the imported collection
- Extract and catalog:
  - HTTP method (GET, POST, PUT, PATCH, DELETE)
  - Complete URL structure (base + path + query parameters)
  - All headers (including auth headers)
  - Request body (raw text and form-encoded where applicable)
- Variable detection and classification:
  - Identify all variables referenced via `{{variable}}` syntax
  - Classify variables as:
    - **Required**: Present in URL, required headers, or critical path
    - **Optional**: Present in query params, optional headers, or body fields with defaults
- Script detection:
  - Detect presence of pre-request scripts
  - Detect presence of test scripts
  - Flag requests that contain scripts (for safety warnings)
- Risk classification for each request:
  - **Safe**: GET requests (read-only)
  - **Write**: POST, PUT, PATCH requests (modify data)
  - **Dangerous**: DELETE requests OR any request containing destructive keywords in URL/description

**Non-goals:**
- Execute Postman scripts (explicitly excluded)
- Dynamic script analysis or execution
- Variable dependency graph resolution
- Automatic variable validation

---

### C. Action Catalog UI

**Requirements:**
- Convert each parsed request into a user-facing **Action**
- Group Actions by their original Postman folder/category
- Display for each Action:
  - Action name (from request name)
  - Short description (derived from request name or folder)
  - Risk label badge (Safe/Write/Dangerous)
  - List of required input variables
  - Warning indicator if scripts are detected
- Provide filtering capabilities:
  - Filter by risk level (Safe / Write / Dangerous)
  - Search by action name or folder
- Action detail view (read-only):
  - Show full request structure
  - Display extracted variables and their classifications
  - Show detected scripts (warning only, not executable)

**Non-goals:**
- Action execution from catalog view (separate flow)
- Form generation in catalog view (separate flow)
- Action editing or modification
- Custom action creation outside of imported collections

---

### D. Setup Wizard & Variable Management

**Requirements:**
- Prompt users to enter missing variables before running any action
- Variable Wallet system for managing all variables:
  - Storage for all variable values
  - Secure secret handling (never display after initial entry)
  - Environment profiles:
    - Workspace-level variables (shared across all environments)
    - Environment-level variables (e.g., Sandbox vs Production)
    - Session-level overrides (temporary, in-memory only)
- Setup wizard flow:
  - Detect missing required variables when user attempts to run action
  - Present form to collect missing variables
  - Allow selection of environment/profile
  - Store securely (encrypt secrets at rest)
- Variable sidebar UI:
  - Quick access to Variable Wallet
  - Environment switcher
  - Visual indicators for:
    - Variables with values vs empty
    - Secret variables (masked)
    - Environment-specific variables

**Non-goals:**
- Variable import from external sources
- Variable templates or presets
- Variable validation against API schemas
- Environment cloning or templates

---

### E. Action Execution

**Requirements:**
- Execute HTTP requests using Action Console's own execution engine
- Variable substitution at runtime:
  - Replace `{{variable}}` in URLs, headers, and body
  - Support nested variable references
  - Fail clearly if required variable is missing
- HTTP method support:
  - GET, POST, PUT, PATCH, DELETE
- Authentication support:
  - Bearer token authentication
  - API key header authentication (X-API-Key, Authorization: ApiKey, etc.)
  - Basic authentication (username:password)
- Response capture:
  - Resolved request (final URL, headers, body after variable substitution)
  - Response status code
  - Response headers
  - Response body (raw text, attempt JSON parsing for display)
- Error handling:
  - Network timeouts (configurable, default 30 seconds)
  - HTTP error status codes (4xx, 5xx)
  - Invalid variable substitution errors
  - Clear error messages for each failure type

**Non-goals:**
- Postman script execution (explicitly excluded)
- OAuth flow automation
- Request retries or exponential backoff
- Request chaining or workflows
- GraphQL support
- WebSocket support

---

### F. Action Form Generation

**Requirements:**
- Auto-generate a form for each Action before execution
- Form field generation:
  - One input field per variable referenced in the action
  - Human-readable labels using simple heuristics:
    - Convert camelCase/PascalCase to Title Case
    - Replace underscores with spaces
    - Use variable name as fallback
  - Default values from Variable Wallet (if available)
  - Support different input types:
    - Text inputs (default)
    - Password inputs (for variables with "secret", "password", "token" in name)
    - Number inputs (if variable name suggests numeric)
- Inline field customization:
  - Allow users to rename field labels (user preference only, doesn't change underlying variable)
  - Save label preferences per workspace

**Non-goals:**
- Custom form layouts or drag-and-drop form builders
- Field validation beyond type checking
- Conditional field display
- Form templates or saved form configurations

---

### G. Safety & Guardrails

**Requirements:**
- Dangerous action protection:
  - Require typed confirmation for Dangerous actions (user must type action name)
  - Require explicit environment confirmation (Sandbox vs Production)
  - Double confirmation for DELETE requests
- Environment indicators:
  - Prominent, always-visible environment badge (Sandbox / Production / etc.)
  - Color coding (e.g., green for Sandbox, red for Production)
  - Environment cannot be changed during action execution flow
- Script warnings:
  - Warning banner when scripts are detected:
    > "⚠️ This request contains Postman scripts that cannot be executed. The request may not behave exactly as it does in Postman."
  - Banner must be visible during action form and execution
- UX safety affordances:
  - Confirmation dialogs for write operations
  - Undo is not possible warning
  - Clear indication of what action will be executed

**Non-goals:**
- Automated safety checks beyond risk classification
- Integration with external safety systems
- Approval workflows or multi-user confirmations
- Action rollback or undo mechanisms

---

### H. Variable Extraction from Responses

**Requirements:**
- After action execution, provide response viewer
- Allow user to:
  - View raw JSON response (formatted)
  - Select a value from the JSON structure (click-to-select)
  - Save selected value as a named variable
- Save-to-variable flow:
  - Prompt for variable name
  - Allow selection of target environment (workspace-level or environment-specific)
  - Immediately store in Variable Wallet
- Immediate reuse:
  - Saved variables appear in Variable Wallet immediately
  - Can be used in subsequent action forms without page refresh

**Non-goals:**
- Automatic variable extraction or parsing
- Variable transformation or data mapping
- Batch extraction of multiple values
- Variable history or versioning

---

### I. Run History & Audit Log

**Requirements:**
- Store each action run with complete metadata:
  - Timestamp (ISO 8601)
  - Action name and ID
  - Environment used
  - Resolved request summary (method, URL, variable values masked for secrets)
  - Outcome (success/failure)
  - Response status code
  - Error message (if failed)
- Run history UI:
  - Recent runs list (last 50 runs, paginated)
  - Sortable by timestamp, action, outcome
  - Filterable by action, environment, outcome
- Per-run detail view:
  - Full resolved request (method, URL, headers, body)
  - Complete response (status, headers, body)
  - Variable values used (secrets masked)
  - Execution duration
  - Error details (if failed)

**Non-goals:**
- Export of run history
- Run history analytics or aggregations
- Run history search beyond basic filters
- Retention policies or automatic cleanup
- Integration with external logging systems

---

### J. UX & Demo Readiness

**Requirements:**
- ESPN collection must work cleanly:
  - All ESPN API requests can be imported
  - All ESPN actions are executable
  - No blocking errors or edge cases
- Shopify collection must work cleanly:
  - All Shopify API requests can be imported
  - All Shopify actions are executable
  - Variable wallet supports Shopify auth patterns
- Full demo capability:
  - Complete demo workflow possible without writing code
  - From import to execution to variable extraction
  - All features accessible and functional
- User experience principles:
  - App feels safe and trustworthy
  - Interface is clear and non-intimidating
  - Plain English language throughout (no technical jargon)
  - Helpful error messages with guidance
  - Loading states and progress indicators

**Non-goals:**
- Support for all possible Postman collection features
- Perfect handling of edge cases in all collections
- Extensive documentation or tutorials within the app
- Onboarding flows or interactive tutorials

---

## Out of Scope (Explicit Non-Goals)

### Postman Script Execution
- Pre-request scripts will not be executed
- Test scripts will not be executed
- Script logic will not be analyzed or replicated

### Postman API Integration
- No connection to Postman Cloud
- No sync with Postman workspaces
- No real-time collection updates

### Advanced Features
- OAuth flow automation
- Request chaining or workflows
- GraphQL support
- WebSocket support
- Webhook handling
- File uploads/downloads

### Multi-user Features
- User accounts or authentication (MVP uses single-user model)
- Collaboration or sharing
- Permission management
- Audit logs for user actions

### Enterprise Features
- SSO integration
- LDAP/AD integration
- Enterprise logging/analytics
- Compliance reporting

---

## Success Criteria

The MVP is considered complete when:

1. ✅ A user can import a Postman collection (ESPN or Shopify) via JSON upload
2. ✅ All requests are parsed, analyzed, and displayed as Actions in the catalog
3. ✅ User can set up required variables via the setup wizard and Variable Wallet
4. ✅ User can generate and fill out an action form
5. ✅ User can execute an action and receive a response
6. ✅ User can extract variables from responses and reuse them
7. ✅ User can view run history for past executions
8. ✅ Safety guardrails prevent accidental dangerous operations
9. ✅ A complete demo can be performed from start to finish without code
10. ✅ ESPN and Shopify collections work end-to-end without blocking issues
