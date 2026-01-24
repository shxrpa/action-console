# Action Console MVP - Technical Plan

**Linear Story:** [SHX-206](https://linear.app/shxrpa/issue/SHX-206)

**Project:** Action Console  
**Status:** MVP - Technical Approach

---

## Architecture Overview

Action Console will be built as a modern web application with a clear separation between frontend and backend concerns. The architecture prioritizes simplicity, safety, and maintainability for the MVP.

### Technology Stack (To Be Determined)

- **Frontend:** Modern web framework (React/Vue/Angular or similar)
- **Backend:** RESTful API (Node.js/Python/Go or similar)
- **Database:** Persistent storage for collections, variables, and run history
- **Authentication:** Simple auth model for MVP (to be determined based on requirements)
- **Storage:** Secure storage for secrets/variables

---

## Implementation Phases

The MVP is broken down into 11 stories (SHX-207 through SHX-217), implemented sequentially:

---

### Story 1: Project Foundation & App Shell
**Linear:** [SHX-207](https://linear.app/shxrpa/issue/SHX-207)

**Technical Approach:**
- Initialize project structure with chosen tech stack
- Set up development environment (build tools, linting, testing)
- Implement basic app shell:
  - Navigation structure
  - Layout components (header, sidebar, main content area)
  - Routing foundation
- Define workspace concept:
  - Data models for workspace entity
  - Workspace selection/creation UI
  - Workspace persistence layer
- Implement empty state UI:
  - Landing page for new workspaces
  - "Import Collection" call-to-action
- Set up basic persistence layer:
  - Database schema for core entities
  - Data access layer abstraction
- Authentication (if required for MVP):
  - Simple auth flow
  - Session management

**Key Deliverables:**
- Compiling, deployable app skeleton
- Empty state with "Import Collection" action
- Basic navigation and layout
- No collection logic, execution, or variables yet

---

### Story 2: Postman Collection Import
**Linear:** [SHX-208](https://linear.app/shxrpa/issue/SHX-208)

**Technical Approach:**
- Implement JSON file upload:
  - File picker UI component
  - File validation (size limits, JSON format)
  - Upload progress indicator
- Postman Collection v2.1 parser:
  - Validate Postman Collection v2.1 schema
  - Extract collection metadata (info.name, info.description, info.schema)
  - Parse folder structure (item hierarchy)
  - Extract request definitions:
    - Request method, URL, headers, body
    - Request name and description
    - Request ID for tracking
- Persistence layer:
  - Database models for:
    - Collection (metadata, import timestamp)
    - Folder (name, parent relationship)
    - Request (method, URL, headers, body, raw JSON)
  - Create/update collection records
- Error handling:
  - Invalid JSON format errors
  - Unsupported Postman version errors
  - Missing required fields errors
  - User-friendly error messages

**Output:**
- Imported collection visible in UI
- Folder/request tree rendered in navigation or catalog view

---

### Story 3: Collection Analysis Engine
**Linear:** [SHX-209](https://linear.app/shxrpa/issue/SHX-209)

**Technical Approach:**
- Request parser:
  - Extract HTTP method from request.method
  - Parse URL structure (base URL + path + query params)
  - Extract headers (including auth headers)
  - Parse body (raw, form-encoded, JSON)
- Variable extraction:
  - Regex pattern matching for `{{variable}}` syntax
  - Search across URL, headers, body
  - Build variable list per request
- Variable classification:
  - Required detection:
    - Variables in URL path segments → required
    - Variables in required headers (Authorization, etc.) → required
    - Variables in critical body fields → required
  - Optional detection:
    - Variables in query parameters → optional
    - Variables in optional headers → optional
    - Variables in body fields with defaults → optional
- Script detection:
  - Check for request.event.preRequestScript array
  - Check for request.event.test array
  - Flag request with `hasScripts: true` if either exists
- Risk classification:
  - Safe: method === "GET"
  - Write: method in ["POST", "PUT", "PATCH"]
  - Dangerous: method === "DELETE" OR contains destructive keywords in URL/name
- Metadata model:
  - Extend Request model with:
    - `variables: Array<{name: string, required: boolean}>`
    - `risk: "Safe" | "Write" | "Dangerous"`
    - `hasScripts: boolean`
    - `warnings: Array<string>`

**Output:**
- Each request enriched with metadata:
  - Extracted variables with required/optional classification
  - Risk level assignment
  - Script detection flags
  - Warnings array for edge cases

---

### Story 4: Action Catalog UI
**Linear:** [SHX-210](https://linear.app/shxrpa/issue/SHX-210)

**Technical Approach:**
- Action model transformation:
  - Map Request entity to Action display model
  - Derive action name from request.name
  - Generate short description from request.name or folder path
- Action list view:
  - Group actions by folder (hierarchical display)
  - Render action cards with:
    - Name and description
    - Risk label badge (color-coded)
    - Required inputs count
    - Script warning icon (if hasScripts)
  - Implement virtualized list for large collections
- Filtering:
  - Filter by risk level (Safe/Write/Dangerous)
  - Filter by folder/category
  - Search by action name (client-side or server-side)
- Action detail view (read-only):
  - Show full request structure:
    - Method and URL
    - Headers (formatted)
    - Body (formatted, syntax highlighting)
  - Display variables:
    - Required variables (highlighted)
    - Optional variables
    - Variable locations (URL, header, body)
  - Show script warning if detected
- Navigation:
  - Click action → navigate to detail view
  - "Run Action" button (placeholder, no execution yet)

**Does NOT include:**
- Action execution
- Form generation
- Variable editing

---

### Story 5: Variable Wallet & Setup Wizard
**Linear:** [SHX-211](https://linear.app/shxrpa/issue/SHX-211)

**Technical Approach:**
- Variable storage model:
  - Variable entity:
    - name: string
    - value: string (encrypted for secrets)
    - isSecret: boolean
    - scope: "workspace" | "environment"
    - environmentId: string | null
    - createdAt, updatedAt timestamps
  - Environment model:
    - name: string (e.g., "Sandbox", "Production")
    - workspaceId: string
- Variable Wallet UI:
  - Sidebar or dedicated page showing all variables
  - Grouped by environment
  - Add/Edit/Delete variable actions
  - Secret masking (show as `••••••` after entry)
  - Environment switcher dropdown
- Setup wizard flow:
  - Triggered when user attempts to run action with missing variables
  - Detect missing required variables:
    - Compare action.variables (required) with Variable Wallet
    - Generate list of missing variables
  - Wizard steps:
    1. List missing variables
    2. Form to collect values (type, label per variable)
    3. Select environment for storage
    4. Save to Variable Wallet
  - Resume action execution after wizard completion
- Secret handling:
  - Encryption at rest (use platform encryption or library)
  - Never display secret values after initial entry
  - Show placeholder or masked value only
- Variable sidebar UI:
  - Quick access panel
  - Environment indicator
  - Visual indicators for:
    - Variables with values (green dot)
    - Empty variables (red dot)
    - Secret variables (lock icon)

---

### Story 6: Action Form Generation
**Linear:** [SHX-212](https://linear.app/shxrpa/issue/SHX-212)

**Technical Approach:**
- Form generation engine:
  - Input: Action with variables
  - Output: Form schema with fields
- Field generation:
  - One field per variable in action.variables
  - Field metadata:
    - variableName: string
    - label: string (generated via heuristics)
    - inputType: "text" | "password" | "number"
    - defaultValue: string (from Variable Wallet)
    - required: boolean
- Label heuristics:
  - Function: `generateLabel(variableName: string) -> string`
  - Rules:
    - Convert camelCase/PascalCase to Title Case: `apiKey` → "Api Key"
    - Replace underscores: `api_key` → "Api Key"
    - Replace hyphens: `api-key` → "Api Key"
    - Capitalize first letter: `apikey` → "Apikey"
- Input type detection:
  - Check variable name for keywords:
    - "secret", "password", "token", "key" → password input
    - "id", "count", "number", "size" → number input
    - Default → text input
- Form UI component:
  - Dynamic form renderer
  - Input fields with labels
  - Validation (required field checking)
  - Submit button ("Run Action")
- Default values:
  - On form load, query Variable Wallet for current environment
  - Pre-populate fields with matching variable values
  - User can edit before submission
- Inline rename capability:
  - User can click label to edit
  - Store label preference in localStorage or user preferences
  - Preference key: `labelPreference.${workspaceId}.${variableName}`

---

### Story 7: Action Execution Engine
**Linear:** [SHX-213](https://linear.app/shxrpa/issue/SHX-213)

**Technical Approach:**
- HTTP runner implementation:
  - Use platform HTTP client (axios, fetch, or similar)
  - Support methods: GET, POST, PUT, PATCH, DELETE
- Variable substitution:
  - Function: `substituteVariables(template: string, variables: Map<string, string>) -> string`
  - Replace all `{{variable}}` occurrences
  - Apply to:
    - URL (base URL, path, query params)
    - Headers (header values)
    - Body (JSON, form-encoded, raw text)
  - Error if required variable missing
- Authentication injection:
  - Bearer token: Add `Authorization: Bearer ${token}` header
  - API key: Add header (configurable name) with value
  - Basic auth: Encode username:password as base64, add `Authorization: Basic ${encoded}` header
  - Determine auth type from Variable Wallet variable names or explicit config
- Request execution:
  - Build final request:
    - Resolved URL (after variable substitution)
    - Resolved headers (after variable substitution + auth)
    - Resolved body (after variable substitution)
  - Execute with timeout (30 seconds default)
  - Handle network errors, timeouts, HTTP errors
- Response capture:
  - Store:
    - resolvedRequest: {method, url, headers, body}
    - responseStatus: number
    - responseHeaders: object
    - responseBody: string
    - executionDuration: number (milliseconds)
    - success: boolean
    - error: string | null

**Explicitly excludes:**
- Postman script execution (no pre-request scripts, no test scripts)

---

### Story 8: Safety & Guardrails
**Linear:** [SHX-214](https://linear.app/shxrpa/issue/SHX-214)

**Technical Approach:**
- Dangerous action confirmation:
  - Before execution, check action.risk === "Dangerous"
  - Show confirmation modal:
    - Display action name
    - Require user to type action name exactly
    - Show current environment prominently
    - "Cancel" and "Confirm" buttons
  - Double confirmation for DELETE methods:
    - First modal: "This is a DELETE request. Are you sure?"
    - Second modal: Type action name
- Environment warnings:
  - Always-visible environment badge:
    - Component: `<EnvironmentBadge environment={currentEnv} />`
    - Color coding:
      - Sandbox/Dev: Green
      - Production: Red
      - Other: Yellow
    - Position: Top-right or header
  - Environment confirmation in dangerous action flow:
    - Show environment selection in confirmation modal
    - Lock environment once confirmed (cannot change mid-flow)
- Script warning banner:
  - Component: `<ScriptWarningBanner hasScripts={true} />`
  - Display when action.hasScripts === true
  - Message: "⚠️ This request contains Postman scripts that cannot be executed. The request may not behave exactly as it does in Postman."
  - Placement: Above action form, visible during execution
- UX safety affordances:
  - Confirmation dialogs for all write operations (POST, PUT, PATCH)
  - "Undo is not possible" warning in confirmation dialogs
  - Show resolved request summary before execution (what will be sent)
  - Clear "Run Action" vs "Cancel" actions

---

### Story 9: Response Viewer & Variable Extraction
**Linear:** [SHX-215](https://linear.app/shxrpa/issue/SHX-215)

**Technical Approach:**
- Raw response viewer:
  - Display formatted JSON (if JSON response)
  - Syntax highlighting for JSON
  - Fallback to plain text for non-JSON
  - Collapsible sections for large responses
- JSON field selection:
  - Interactive JSON tree view:
    - Expandable/collapsible nodes
    - Click to select value
    - Highlight selected path (e.g., `data.user.email`)
  - Extract selected value:
    - Get JSON path: `data.user.email`
    - Get value: `"user@example.com"`
    - Store for save-to-variable flow
- Save-to-variable flow:
  - On value selection, show "Save as Variable" button
  - Modal/form:
    - Variable name input (pre-filled with JSON path, editable)
    - Environment selection (workspace-level or current environment)
    - "Save" button
  - Save to Variable Wallet:
    - Create new variable or update existing
    - Store value (encrypt if marked as secret)
  - Immediate UI update:
    - Variable Wallet sidebar refreshes
    - New variable appears in list
- Immediate reuse in forms:
  - After saving, if user opens another action form:
    - Check Variable Wallet for matching variable names
    - Pre-populate form fields with saved values
    - No page refresh required (reactive updates)

---

### Story 10: Run History & Audit Log
**Linear:** [SHX-216](https://linear.app/shxrpa/issue/SHX-216)

**Technical Approach:**
- Run storage model:
  - Run entity:
    - id: string (UUID)
    - timestamp: ISO 8601
    - actionId: string (reference to Action)
    - actionName: string (denormalized for display)
    - environmentId: string
    - environmentName: string (denormalized)
    - resolvedRequest: object (method, url, headers, body - secrets masked)
    - responseStatus: number
    - responseHeaders: object
    - responseBody: string (may be large, consider compression)
    - success: boolean
    - error: string | null
    - executionDuration: number (milliseconds)
  - Create run record after each execution (success or failure)
- Recent runs UI:
  - List view component:
    - Last 50 runs (pagination for older runs)
    - Columns: Timestamp, Action, Environment, Status, Duration
    - Sortable columns (default: timestamp DESC)
    - Filterable by:
      - Action (dropdown)
      - Environment (dropdown)
      - Outcome (Success/Failure/All)
  - Virtualized list for performance
- Per-run detail view:
  - Route: `/runs/:runId`
  - Display sections:
    - Run metadata (timestamp, action, environment, duration, outcome)
    - Resolved request (formatted, secrets masked)
    - Response (formatted JSON or text)
    - Error details (if failed)
  - "View Raw" button for full response body
  - "Copy Request" / "Copy Response" actions

---

### Story 11: Demo Hardening (ESPN + Shopify)
**Linear:** [SHX-217](https://linear.app/shxrpa/issue/SHX-217)

**Technical Approach:**
- ESPN collection validation:
  - Test import with real ESPN Postman collection
  - Identify and fix edge cases:
    - Unusual variable patterns
    - Complex URL structures
    - Auth header formats
  - Validate all ESPN requests are executable
- Shopify collection validation:
  - Test import with real Shopify Postman collection
  - Handle Shopify-specific patterns:
    - API versioning in URLs
    - Shopify auth (API key + secret)
    - GraphQL requests (handle gracefully, may be limited)
  - Validate all Shopify requests are executable
- UX polish for common paths:
  - Smooth import flow (loading states, progress)
  - Clear error messages for common failures
  - Helpful empty states
  - Consistent button styles and interactions
- Edge-case handling:
  - Handle malformed JSON gracefully
  - Handle extremely large collections (performance)
  - Handle missing optional fields
  - Handle Unicode characters in names/descriptions
  - Handle very long variable names or values
  - Handle empty collections or folders

**Deliverable:**
- Complete end-to-end demo workflow works flawlessly
- ESPN and Shopify collections work without blocking issues

---

## Data Models

### Core Entities

```
Collection
  - id: UUID
  - name: string
  - description: string
  - postmanSchemaVersion: string
  - importedAt: timestamp
  - workspaceId: UUID

Folder
  - id: UUID
  - name: string
  - parentId: UUID | null (for nested folders)
  - collectionId: UUID
  - order: number

Request
  - id: UUID
  - name: string
  - method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  - url: string (raw URL template)
  - headers: object (raw headers object)
  - body: string (raw body)
  - folderId: UUID | null
  - collectionId: UUID

Action (extends Request)
  - variables: Array<VariableRef>
  - risk: "Safe" | "Write" | "Dangerous"
  - hasScripts: boolean
  - warnings: Array<string>

VariableRef
  - name: string
  - required: boolean
  - locations: Array<"url" | "header" | "body">

Variable
  - id: UUID
  - name: string
  - value: string (encrypted if isSecret)
  - isSecret: boolean
  - scope: "workspace" | "environment"
  - environmentId: UUID | null
  - workspaceId: UUID

Environment
  - id: UUID
  - name: string
  - workspaceId: UUID

Run
  - id: UUID
  - timestamp: ISO 8601
  - actionId: UUID
  - actionName: string
  - environmentId: UUID
  - environmentName: string
  - resolvedRequest: object
  - responseStatus: number
  - responseHeaders: object
  - responseBody: string
  - success: boolean
  - error: string | null
  - executionDuration: number
```

---

## Security Considerations

- **Secret Storage:** All secret variables must be encrypted at rest
- **Secret Masking:** Never display secret values in UI or logs
- **Input Validation:** Validate all user inputs to prevent injection
- **HTTP Security:** Use HTTPS for all API calls, validate certificates
- **Error Messages:** Don't expose sensitive information in error messages
- **Rate Limiting:** Consider rate limiting for API execution (future enhancement)

---

## Performance Considerations

- **Large Collections:** Handle collections with 100+ requests efficiently (virtualized lists)
- **Large Responses:** Compress or truncate large response bodies in storage
- **Run History:** Paginate run history to avoid loading all records
- **Variable Substitution:** Efficient regex for variable replacement
- **Form Generation:** Cache form schemas to avoid regeneration

---

## Testing Strategy

- **Unit Tests:** Core parsing, variable extraction, risk classification
- **Integration Tests:** Import flow, execution flow, variable wallet operations
- **End-to-End Tests:** Complete workflows with ESPN and Shopify collections
- **Manual Testing:** Demo scenarios, edge cases, UX validation

---

## Deployment Considerations

- **Environment Variables:** Store configuration (API endpoints, encryption keys) as environment variables
- **Database Migrations:** Version-controlled schema migrations
- **Build Process:** Automated build and deployment pipeline
- **Error Monitoring:** Integration with error tracking service (Sentry, etc.)
