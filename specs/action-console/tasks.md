# Action Console MVP - Implementation Tasks

**Linear Story:** [SHX-206](https://linear.app/shxrpa/issue/SHX-206)

**Project:** Action Console  
**Status:** MVP - Atomic Implementation Steps

---

## Task Breakdown by Linear Story

Each Linear story maps to atomic implementation tasks. Tasks should be completed sequentially within each story, and stories should be completed in order.

---

## Story 1: Project Foundation & App Shell
**Linear:** [SHX-207](https://linear.app/shxrpa/issue/SHX-207)

### Tasks

- [ ] **Task 1.1:** Initialize project with chosen technology stack (React/Vue/Angular, Node.js/Python/Go, database)
  - Set up project directory structure
  - Initialize package/dependency management
  - Configure build tools and bundlers
  - Set up development environment

- [ ] **Task 1.2:** Set up development tooling
  - Configure linting (ESLint/Prettier or equivalent)
  - Set up unit testing framework
  - Configure code formatting
  - Set up pre-commit hooks (optional)

- [ ] **Task 1.3:** Implement basic app shell structure
  - Create layout components (Header, Sidebar, MainContent)
  - Set up routing structure (React Router or equivalent)
  - Implement navigation menu structure
  - Create responsive layout system

- [ ] **Task 1.4:** Define workspace data model
  - Create Workspace entity in database
  - Define workspace schema (id, name, createdAt, updatedAt)
  - Implement workspace CRUD operations
  - Create workspace API endpoints

- [ ] **Task 1.5:** Implement workspace selection/creation UI
  - Create workspace list view
  - Implement workspace creation modal/form
  - Implement workspace selection dropdown
  - Add workspace switching logic

- [ ] **Task 1.6:** Implement basic persistence layer
  - Set up database connection
  - Create database migration system
  - Implement base data access layer
  - Create repository pattern or ORM setup

- [ ] **Task 1.7:** Implement empty state UI
  - Create landing page component for new workspaces
  - Design "Import Collection" call-to-action
  - Add empty state illustrations/placeholders
  - Implement navigation to import flow

- [ ] **Task 1.8:** Implement authentication (if required for MVP)
  - Design simple auth flow (login/session)
  - Implement session management
  - Create protected route wrapper
  - Add logout functionality

- [ ] **Task 1.9:** Verify app compiles and deploys
  - Build and deploy to staging environment
  - Verify app renders empty state
  - Test navigation and routing
  - Confirm no runtime errors

---

## Story 2: Postman Collection Import
**Linear:** [SHX-208](https://linear.app/shxrpa/issue/SHX-208)

### Tasks

- [ ] **Task 2.1:** Implement JSON file upload UI
  - Create file picker component
  - Add drag-and-drop file upload support
  - Implement file validation (size limits, file type)
  - Add upload progress indicator

- [ ] **Task 2.2:** Implement Postman Collection v2.1 schema validation
  - Add JSON schema validation library
  - Create Postman Collection v2.1 schema validator
  - Validate required fields (info, item)
  - Return clear validation errors

- [ ] **Task 2.3:** Implement collection metadata extraction
  - Parse collection info object (name, description, schema)
  - Extract schema version (v2.1)
  - Store collection metadata
  - Return collection ID after import

- [ ] **Task 2.4:** Implement folder structure parser
  - Recursively parse item hierarchy
  - Extract folder names
  - Build folder tree structure
  - Preserve folder nesting/ordering

- [ ] **Task 2.5:** Implement request definition parser
  - Extract request method from item.request.method
  - Parse URL structure (raw URL template)
  - Extract headers object
  - Extract body (raw, form-encoded, JSON)

- [ ] **Task 2.6:** Create database models for collections, folders, requests
  - Create Collection table/collection (id, name, description, schemaVersion, workspaceId, importedAt)
  - Create Folder table/collection (id, name, parentId, collectionId, order)
  - Create Request table/collection (id, name, method, url, headers, body, folderId, collectionId, rawJson)
  - Define relationships (foreign keys or references)

- [ ] **Task 2.7:** Implement collection persistence
  - Save collection metadata to database
  - Save folder structure to database
  - Save all requests to database
  - Handle transaction/rollback on errors

- [ ] **Task 2.8:** Implement error handling for invalid files
  - Catch JSON parsing errors
  - Handle unsupported Postman version errors
  - Handle missing required fields
  - Display user-friendly error messages

- [ ] **Task 2.9:** Implement collection list view in UI
  - Display imported collections
  - Show collection name, import date, request count
  - Add "View Collection" action
  - Implement collection deletion (optional)

- [ ] **Task 2.10:** Implement folder/request tree view
  - Render folder hierarchy (expandable/collapsible)
  - Display requests under folders
  - Show request method and name
  - Implement tree navigation

---

## Story 3: Collection Analysis Engine
**Linear:** [SHX-209](https://linear.app/shxrpa/issue/SHX-209)

### Tasks

- [ ] **Task 3.1:** Implement variable extraction from URL
  - Create regex pattern for `{{variable}}` syntax
  - Extract variables from base URL
  - Extract variables from path segments
  - Extract variables from query parameters

- [ ] **Task 3.2:** Implement variable extraction from headers
  - Search headers object for `{{variable}}` patterns
  - Extract variable names from header values
  - Track which headers contain variables
  - Build variable list with location metadata

- [ ] **Task 3.3:** Implement variable extraction from body
  - Parse body (raw, form-encoded, JSON)
  - Search body content for `{{variable}}` patterns
  - Extract variable names from body fields
  - Handle nested JSON structures

- [ ] **Task 3.4:** Implement variable classification logic (required vs optional)
  - Variables in URL path → required
  - Variables in required headers (Authorization, etc.) → required
  - Variables in critical body fields → required
  - Variables in query params → optional
  - Variables in optional headers → optional
  - Variables in body fields with defaults → optional

- [ ] **Task 3.5:** Implement script detection
  - Check for request.event.preRequestScript array
  - Check for request.event.test array
  - Flag request with `hasScripts: boolean`
  - Store script detection result

- [ ] **Task 3.6:** Implement risk classification
  - Check method === "GET" → Safe
  - Check method in ["POST", "PUT", "PATCH"] → Write
  - Check method === "DELETE" → Dangerous
  - Check for destructive keywords in URL/name → Dangerous
  - Assign risk level to request

- [ ] **Task 3.7:** Create VariableRef data model
  - Define VariableRef structure (name, required, locations)
  - Create database migration for variables field
  - Update Request model to include variables array

- [ ] **Task 3.8:** Update Request model with analysis metadata
  - Add variables: Array<VariableRef> field
  - Add risk: "Safe" | "Write" | "Dangerous" field
  - Add hasScripts: boolean field
  - Add warnings: Array<string> field

- [ ] **Task 3.9:** Implement analysis runner
  - Create analysis service/function
  - Run analysis for each request after import
  - Store analysis results in database
  - Handle analysis errors gracefully

- [ ] **Task 3.10:** Add analysis progress indicator
  - Show progress during analysis (for large collections)
  - Display "Analyzing collection..." message
  - Update progress bar/counter
  - Show completion message

---

## Story 4: Action Catalog UI
**Linear:** [SHX-210](https://linear.app/shxrpa/issue/SHX-210)

### Tasks

- [ ] **Task 4.1:** Create Action display model transformation
  - Map Request entity to Action display model
  - Derive action name from request.name
  - Generate short description from request.name or folder path
  - Include risk, variables, hasScripts in display model

- [ ] **Task 4.2:** Implement action list view
  - Create action card component
  - Display action name and description
  - Show risk label badge (color-coded)
  - Display required inputs count
  - Show script warning icon (if hasScripts)

- [ ] **Task 4.3:** Implement folder grouping
  - Group actions by folder/category
  - Render folder headers
  - Render actions under folders
  - Preserve folder hierarchy

- [ ] **Task 4.4:** Implement risk level filtering
  - Add filter controls (Safe/Write/Dangerous checkboxes)
  - Filter actions by risk level
  - Update action list when filter changes
  - Show filter count badges

- [ ] **Task 4.5:** Implement search functionality
  - Add search input field
  - Search by action name (client-side or server-side)
  - Search by folder name
  - Update action list with search results

- [ ] **Task 4.6:** Implement virtualized list for large collections
  - Use virtualization library (react-window, vue-virtual-scroller, etc.)
  - Render only visible items
  - Handle scrolling performance
  - Test with 100+ actions

- [ ] **Task 4.7:** Create action detail view (read-only)
  - Create detail view route/component
  - Display full request structure:
    - Method and URL (formatted)
    - Headers (formatted table)
    - Body (formatted, syntax highlighting)
  - Show extracted variables:
    - Required variables (highlighted)
    - Optional variables
    - Variable locations (URL, header, body badges)
  - Display script warning if detected

- [ ] **Task 4.8:** Implement navigation to detail view
  - Add click handler on action card
  - Navigate to detail view route
  - Pass action ID to detail view
  - Load action data in detail view

- [ ] **Task 4.9:** Add "Run Action" button (placeholder)
  - Add button to action detail view
  - Disable button (no execution yet)
  - Show "Coming soon" tooltip or disabled state
  - Style button for future implementation

---

## Story 5: Variable Wallet & Setup Wizard
**Linear:** [SHX-211](https://linear.app/shxrpa/issue/SHX-211)

### Tasks

- [ ] **Task 5.1:** Create Variable data model
  - Define Variable schema (id, name, value, isSecret, scope, environmentId, workspaceId, timestamps)
  - Create database table/collection for variables
  - Add indexes for efficient queries (workspaceId, environmentId, name)

- [ ] **Task 5.2:** Create Environment data model
  - Define Environment schema (id, name, workspaceId, timestamps)
  - Create database table/collection for environments
  - Add default environments (Sandbox, Production) on workspace creation

- [ ] **Task 5.3:** Implement secret encryption/decryption
  - Choose encryption library (crypto, bcrypt, or platform-specific)
  - Implement encryption function for secret values
  - Implement decryption function (for runtime use only)
  - Store encryption key securely (environment variable)

- [ ] **Task 5.4:** Implement Variable Wallet CRUD operations
  - Create variable (with encryption for secrets)
  - Read variables (decrypt secrets only when needed)
  - Update variable (re-encrypt if secret changed)
  - Delete variable
  - List variables by workspace/environment

- [ ] **Task 5.5:** Create Variable Wallet UI (sidebar or page)
  - Design variable list component
  - Display variables grouped by environment
  - Show variable name, masked value (for secrets), scope
  - Add Add/Edit/Delete actions

- [ ] **Task 5.6:** Implement secret masking in UI
  - Display secrets as `••••••` after initial entry
  - Never show secret values in UI
  - Show "Show" / "Hide" toggle for secrets (optional, for verification)
  - Use lock icon for secret variables

- [ ] **Task 5.7:** Implement environment switcher
  - Create environment dropdown component
  - List all environments for current workspace
  - Switch environment on selection
  - Update variable list when environment changes

- [ ] **Task 5.8:** Implement missing variable detection
  - Function: `detectMissingVariables(action: Action, variables: Variable[], environment: Environment): string[]`
  - Compare action.requiredVariables with Variable Wallet
  - Filter by current environment (workspace-level + environment-level)
  - Return list of missing variable names

- [ ] **Task 5.9:** Create setup wizard flow
  - Trigger wizard when user attempts to run action with missing variables
  - Wizard step 1: Display missing variables list
  - Wizard step 2: Form to collect values (one field per variable)
  - Wizard step 3: Select environment for storage (workspace or environment-specific)
  - Wizard step 4: Save variables to Variable Wallet
  - Resume action execution after wizard completion

- [ ] **Task 5.10:** Add visual indicators in Variable Wallet
  - Green dot for variables with values
  - Red dot for empty variables
  - Lock icon for secret variables
  - Environment badge for environment-specific variables

---

## Story 6: Action Form Generation
**Linear:** [SHX-212](https://linear.app/shxrpa/issue/SHX-212)

### Tasks

- [ ] **Task 6.1:** Create form generation engine
  - Function: `generateFormSchema(action: Action): FormSchema`
  - Input: Action with variables
  - Output: Form schema with fields array

- [ ] **Task 6.2:** Implement field generation (one per variable)
  - Create field object for each variable in action.variables
  - Field structure: {variableName, label, inputType, defaultValue, required}
  - Generate fields array

- [ ] **Task 6.3:** Implement label heuristics function
  - Function: `generateLabel(variableName: string): string`
  - Convert camelCase to Title Case: `apiKey` → "Api Key"
  - Convert PascalCase to Title Case: `ApiKey` → "Api Key"
  - Replace underscores: `api_key` → "Api Key"
  - Replace hyphens: `api-key` → "Api Key"
  - Capitalize first letter: `apikey` → "Apikey"

- [ ] **Task 6.4:** Implement input type detection
  - Function: `detectInputType(variableName: string): "text" | "password" | "number"`
  - Check variable name for keywords:
    - "secret", "password", "token", "key" → password
    - "id", "count", "number", "size" → number
    - Default → text
  - Case-insensitive matching

- [ ] **Task 6.5:** Implement default value population from Variable Wallet
  - On form load, query Variable Wallet for current environment
  - Match form variables with Variable Wallet by name
  - Pre-populate fields with matching values
  - Handle secrets (show as empty, user must re-enter)

- [ ] **Task 6.6:** Create dynamic form UI component
  - Build form renderer that accepts FormSchema
  - Render input fields dynamically
  - Apply labels, input types, default values
  - Handle required field validation

- [ ] **Task 6.7:** Implement form validation
  - Validate required fields (show error if empty)
  - Validate input types (number format, etc.)
  - Display validation errors inline
  - Disable submit button if validation fails

- [ ] **Task 6.8:** Implement inline label rename capability
  - Add edit icon/button next to label
  - On click, make label editable (input field)
  - Save label preference to localStorage or user preferences
  - Preference key: `labelPreference.${workspaceId}.${variableName}`
  - Load saved preferences on form generation

- [ ] **Task 6.9:** Integrate form generation into action execution flow
  - Trigger form generation when user clicks "Run Action"
  - Display form before execution
  - Collect form values on submit
  - Pass values to execution engine

- [ ] **Task 6.10:** Add form submission handler
  - Collect all form field values
  - Build variables map (variableName → value)
  - Validate all required fields are filled
  - Proceed to execution with variables map

---

## Story 7: Action Execution Engine
**Linear:** [SHX-213](https://linear.app/shxrpa/issue/SHX-213)

### Tasks

- [ ] **Task 7.1:** Choose and set up HTTP client library
  - Select HTTP client (axios, fetch, or platform equivalent)
  - Configure default timeout (30 seconds)
  - Set up request interceptors for logging

- [ ] **Task 7.2:** Implement variable substitution function
  - Function: `substituteVariables(template: string, variables: Map<string, string>): string`
  - Replace all `{{variable}}` occurrences with values
  - Handle missing variables (error or empty string)
  - Support nested variable references (if needed)

- [ ] **Task 7.3:** Implement URL variable substitution
  - Apply substitution to base URL
  - Apply substitution to path segments
  - Apply substitution to query parameters
  - Build final resolved URL

- [ ] **Task 7.4:** Implement header variable substitution
  - Apply substitution to header values
  - Preserve header names unchanged
  - Build final resolved headers object

- [ ] **Task 7.5:** Implement body variable substitution
  - Apply substitution to raw body text
  - Apply substitution to form-encoded body
  - Apply substitution to JSON body (stringify after substitution)
  - Handle nested JSON structures

- [ ] **Task 7.6:** Implement authentication injection (Bearer token)
  - Detect Bearer token from Variable Wallet (check variable name patterns)
  - Add `Authorization: Bearer ${token}` header
  - Override existing Authorization header if present

- [ ] **Task 7.7:** Implement authentication injection (API key)
  - Detect API key from Variable Wallet
  - Determine header name (X-API-Key, Authorization: ApiKey, or configurable)
  - Add API key header with value

- [ ] **Task 7.8:** Implement authentication injection (Basic auth)
  - Detect username/password from Variable Wallet
  - Encode username:password as base64
  - Add `Authorization: Basic ${encoded}` header

- [ ] **Task 7.9:** Implement request execution
  - Build final request object (method, url, headers, body)
  - Execute HTTP request with chosen client
  - Handle network errors (connection failed, timeout)
  - Handle HTTP errors (4xx, 5xx status codes)
  - Set timeout (30 seconds default)

- [ ] **Task 7.10:** Implement response capture
  - Capture response status code
  - Capture response headers (object)
  - Capture response body (string, preserve raw)
  - Measure execution duration (start/end timestamps)
  - Determine success (status 200-299) or failure

- [ ] **Task 7.11:** Implement error handling
  - Network errors: "Connection failed" or "Request timeout"
  - HTTP errors: "HTTP {status}: {statusText}"
  - Variable substitution errors: "Missing required variable: {name}"
  - Return structured error object

- [ ] **Task 7.12:** Create execution result model
  - Result structure: {resolvedRequest, responseStatus, responseHeaders, responseBody, success, error, executionDuration}
  - Store resolved request (for debugging/audit)
  - Store execution result for run history

---

## Story 8: Safety & Guardrails
**Linear:** [SHX-214](https://linear.app/shxrpa/issue/SHX-214)

### Tasks

- [x] **Task 8.1:** Create dangerous action confirmation modal
  - Check action.risk === "Dangerous" before execution
  - Show confirmation modal component
  - Display action name prominently
  - Require user to type action name exactly (input field)
  - Add "Cancel" and "Confirm" buttons

- [x] **Task 8.2:** Implement typed confirmation validation
  - Compare user input with action name (case-sensitive or case-insensitive)
  - Disable "Confirm" button if input doesn't match
  - Show validation message if mismatch
  - Enable "Confirm" button only on match

- [x] **Task 8.3:** Implement double confirmation for DELETE methods
  - First modal: "This is a DELETE request. Are you sure?"
  - Show action name and URL
  - "Cancel" and "Continue" buttons
  - On "Continue", show second modal (typed confirmation)

- [x] **Task 8.4:** Create EnvironmentBadge component
  - Component: `<EnvironmentBadge environment={currentEnv} />`
  - Display environment name prominently
  - Color coding: Green (Sandbox/Dev), Red (Production), Yellow (Other)
  - Position: Top-right of header or above action form

- [x] **Task 8.5:** Implement environment confirmation in dangerous action flow
  - Show environment selection in confirmation modal
  - Display current environment prominently
  - Lock environment once confirmed (prevent changes mid-flow)
  - Require explicit environment confirmation checkbox

- [x] **Task 8.6:** Create ScriptWarningBanner component
  - Component: `<ScriptWarningBanner hasScripts={true} />`
  - Display warning message: "⚠️ This request contains Postman scripts that cannot be executed. The request may not behave exactly as it does in Postman."
  - Style with warning colors (yellow/amber)
  - Dismissible or always visible (prefer always visible)

- [x] **Task 8.7:** Integrate script warning banner into action form
  - Check action.hasScripts === true
  - Display banner above action form
  - Keep banner visible during execution flow
  - Hide banner if hasScripts === false

- [x] **Task 8.8:** Add confirmation dialogs for write operations
  - Show confirmation for POST requests
  - Show confirmation for PUT requests
  - Show confirmation for PATCH requests
  - Display "Undo is not possible" warning in dialog

- [x] **Task 8.9:** Implement resolved request preview
  - Before execution, show resolved request summary
  - Display: Method, URL, headers count, body preview
  - Mask secrets in preview
  - Allow user to review before confirming

- [x] **Task 8.10:** Implement clear action buttons
  - "Run Action" button (primary, colored)
  - "Cancel" button (secondary, outlined)
  - Disable buttons during execution
  - Show loading state on "Run Action" button

---

## Story 9: Response Viewer & Variable Extraction
**Linear:** [SHX-215](https://linear.app/shxrpa/issue/SHX-215)

### Tasks

- [x] **Task 9.1:** Create raw response viewer component
  - Display response body as formatted text
  - Attempt JSON parsing for formatting
  - Apply syntax highlighting for JSON (use library like Prism, highlight.js)
  - Fallback to plain text for non-JSON

- [x] **Task 9.2:** Implement collapsible sections for large responses
  - Add expand/collapse functionality for large JSON objects/arrays
  - Default to collapsed for objects/arrays > 10 items
  - Show "Show more" / "Show less" buttons
  - Preserve scroll position when expanding

- [x] **Task 9.3:** Implement interactive JSON tree view
  - Use JSON tree viewer library (react-json-view, vue-json-pretty, etc.)
  - Render expandable/collapsible nodes
  - Highlight node on hover
  - Show JSON path on hover (e.g., `data.user.email`)

- [x] **Task 9.4:** Implement click-to-select value functionality
  - Add click handler on JSON tree nodes
  - On click, select value and JSON path
  - Highlight selected node visually
  - Store selected value and path in state

- [x] **Task 9.5:** Create "Save as Variable" button
  - Show button when value is selected
  - Position button near selected value or in toolbar
  - Enable/disable based on selection state

- [x] **Task 9.6:** Create save-to-variable modal/form
  - Modal component with form:
    - Variable name input (pre-filled with JSON path, editable)
    - Environment selection (workspace-level or current environment)
    - Secret toggle (optional, for sensitive values)
    - "Save" and "Cancel" buttons
  - Validate variable name (no spaces, valid characters)

- [x] **Task 9.7:** Implement save-to-variable logic
  - Extract selected value (string, number, boolean)
  - Convert value to string if needed
  - Create new variable or update existing in Variable Wallet
  - Encrypt value if marked as secret
  - Store with selected environment scope

- [x] **Task 9.8:** Implement immediate Variable Wallet UI update
  - Refresh Variable Wallet sidebar after save
  - Add new variable to list immediately
  - Highlight newly added variable
  - No page refresh required (reactive update)

- [x] **Task 9.9:** Implement immediate reuse in forms
  - After saving, check if any open action forms use saved variable name
  - Pre-populate form fields with saved value
  - Update form UI reactively
  - Show success message: "Variable saved and added to form"

- [x] **Task 9.10:** Handle non-JSON responses gracefully
  - Detect response content type
  - If not JSON, show as plain text
  - Provide "Copy" button for text responses
  - Disable variable extraction for non-JSON (or extract whole text)

---

## Story 10: Run History & Audit Log
**Linear:** [SHX-216](https://linear.app/shxrpa/issue/SHX-216)

### Tasks

- [ ] **Task 10.1:** Create Run data model
  - Define Run schema:
    - id: UUID
    - timestamp: ISO 8601
    - actionId: UUID (reference to Action)
    - actionName: string (denormalized)
    - environmentId: UUID
    - environmentName: string (denormalized)
    - resolvedRequest: object (method, url, headers, body - secrets masked)
    - responseStatus: number
    - responseHeaders: object
    - responseBody: string (consider compression for large responses)
    - success: boolean
    - error: string | null
    - executionDuration: number (milliseconds)
  - Create database table/collection for runs
  - Add indexes (timestamp, actionId, environmentId, workspaceId)

- [ ] **Task 10.2:** Implement secret masking in resolved request
  - Function: `maskSecrets(request: object, secrets: string[]): object`
  - Replace secret values with `***MASKED***` in headers and body
  - Preserve structure and formatting
  - Store masked request in Run entity

- [ ] **Task 10.3:** Implement run creation after execution
  - After each action execution (success or failure), create Run record
  - Store all execution metadata
  - Store masked resolved request
  - Store full response (consider size limits)
  - Return run ID

- [ ] **Task 10.4:** Create recent runs list view
  - Display last 50 runs in table/list format
  - Columns: Timestamp, Action, Environment, Status, Duration
  - Sort by timestamp DESC (default)
  - Paginate for older runs (page size: 50)

- [ ] **Task 10.5:** Implement sorting in runs list
  - Sortable columns: Timestamp, Action, Status, Duration
  - Toggle sort direction on column header click
  - Update list when sort changes
  - Show sort indicator (arrow up/down)

- [ ] **Task 10.6:** Implement filtering in runs list
  - Filter by action (dropdown with all actions)
  - Filter by environment (dropdown with all environments)
  - Filter by outcome (Success/Failure/All)
  - Apply filters simultaneously (AND logic)
  - Show active filter badges

- [ ] **Task 10.7:** Implement virtualized list for runs
  - Use virtualization library for performance
  - Render only visible rows
  - Handle large run history (100+ runs)
  - Smooth scrolling

- [ ] **Task 10.8:** Create per-run detail view route
  - Route: `/runs/:runId`
  - Load run data by ID
  - Display full run details

- [ ] **Task 10.9:** Implement run detail view sections
  - Section 1: Run metadata
    - Timestamp (formatted)
    - Action name (link to action)
    - Environment name (badge)
    - Execution duration
    - Outcome (Success/Failure badge)
  - Section 2: Resolved request
    - Method, URL (formatted)
    - Headers (table, secrets masked)
    - Body (formatted, secrets masked)
  - Section 3: Response
    - Status code and status text
    - Headers (table)
    - Body (formatted JSON or text)
  - Section 4: Error details (if failed)
    - Error message
    - Stack trace (if available)

- [ ] **Task 10.10:** Add "View Raw" functionality
  - "View Raw Request" button (show full request JSON)
  - "View Raw Response" button (show full response text)
  - Display in modal or expandable section
  - Add "Copy" button for raw content

- [ ] **Task 10.11:** Add copy functionality
  - "Copy Request" button (copy resolved request as JSON)
  - "Copy Response" button (copy response body)
  - Show success toast on copy
  - Handle large content (truncate or stream)

- [ ] **Task 10.12:** Implement response body size management
  - Truncate very large response bodies in storage (e.g., > 1MB)
  - Store truncated flag
  - Show "Response too large, truncated" message
  - Store full response in separate storage if needed (future enhancement)

---

## Story 11: Demo Hardening (ESPN + Shopify)
**Linear:** [SHX-217](https://linear.app/shxrpa/issue/SHX-217)

### Tasks

- [ ] **Task 11.1:** Obtain and test ESPN Postman collection
  - Import ESPN collection JSON
  - Validate import succeeds
  - Check all requests are parsed correctly
  - Identify any edge cases or issues

- [ ] **Task 11.2:** Fix ESPN collection edge cases
  - Handle unusual variable patterns in ESPN collection
  - Fix complex URL structures if needed
  - Handle ESPN-specific auth header formats
  - Ensure all ESPN requests are executable

- [ ] **Task 11.3:** Test ESPN collection end-to-end
  - Import ESPN collection
  - Navigate action catalog
  - Set up variables in Variable Wallet
  - Execute sample ESPN actions
  - Extract variables from responses
  - Verify complete workflow works

- [ ] **Task 11.4:** Obtain and test Shopify Postman collection
  - Import Shopify collection JSON
  - Validate import succeeds
  - Check all requests are parsed correctly
  - Identify any edge cases or issues

- [ ] **Task 11.5:** Fix Shopify collection edge cases
  - Handle Shopify API versioning in URLs
  - Handle Shopify auth (API key + secret pattern)
  - Handle GraphQL requests gracefully (may be limited in MVP)
  - Ensure all Shopify requests are executable

- [ ] **Task 11.6:** Test Shopify collection end-to-end
  - Import Shopify collection
  - Navigate action catalog
  - Set up Shopify variables (API key, secret, shop domain)
  - Execute sample Shopify actions
  - Extract variables from responses
  - Verify complete workflow works

- [ ] **Task 11.7:** UX polish for import flow
  - Add loading states during import
  - Show progress indicator for large collections
  - Display success message after import
  - Handle import errors gracefully with clear messages

- [ ] **Task 11.8:** UX polish for action execution flow
  - Add loading spinner during execution
  - Show progress: "Executing request..."
  - Display success/error messages clearly
  - Add smooth transitions between states

- [ ] **Task 11.9:** Handle edge cases - malformed JSON
  - Test with invalid JSON files
  - Show clear error message
  - Provide guidance on fixing JSON
  - Prevent app crash

- [ ] **Task 11.10:** Handle edge cases - extremely large collections
  - Test with collection containing 100+ requests
  - Ensure performance is acceptable
  - Use virtualization where needed
  - Add pagination if necessary

- [ ] **Task 11.11:** Handle edge cases - missing optional fields
  - Handle requests without descriptions
  - Handle requests without names
  - Handle empty folders
  - Handle missing optional headers

- [ ] **Task 11.12:** Handle edge cases - Unicode characters
  - Test with Unicode in collection names
  - Test with Unicode in request names
  - Test with Unicode in variable names
  - Ensure proper encoding/display

- [ ] **Task 11.13:** Handle edge cases - very long names/values
  - Truncate very long variable names in UI (with tooltip for full name)
  - Handle very long variable values
  - Handle very long URLs (wrap or truncate)
  - Ensure UI doesn't break

- [ ] **Task 11.14:** Handle edge cases - empty collections
  - Handle collections with no requests
  - Show helpful empty state message
  - Prevent errors when navigating empty collection

- [ ] **Task 11.15:** Perform complete demo workflow test
  - Start from empty workspace
  - Import ESPN collection
  - Browse action catalog
  - Set up variables via wizard
  - Execute multiple actions
  - Extract variables from responses
  - View run history
  - Repeat with Shopify collection
  - Verify no blocking issues

- [ ] **Task 11.16:** Document any known limitations
  - List features not supported in MVP
  - Document edge cases that may not work perfectly
  - Create troubleshooting guide
  - Update README with demo instructions

---

## Cross-Story Tasks

### Testing Tasks

- [ ] **Test Task:** Unit tests for core parsing logic
- [ ] **Test Task:** Unit tests for variable extraction
- [ ] **Test Task:** Unit tests for risk classification
- [ ] **Test Task:** Integration tests for import flow
- [ ] **Test Task:** Integration tests for execution flow
- [ ] **Test Task:** Integration tests for Variable Wallet
- [ ] **Test Task:** End-to-end tests for complete workflows
- [ ] **Test Task:** Manual testing with ESPN collection
- [ ] **Test Task:** Manual testing with Shopify collection

### Documentation Tasks

- [ ] **Doc Task:** Update README with setup instructions
- [ ] **Doc Task:** Document API endpoints (if backend)
- [ ] **Doc Task:** Document data models
- [ ] **Doc Task:** Create user guide for basic workflows
- [ ] **Doc Task:** Document troubleshooting common issues

### Deployment Tasks

- [ ] **Deploy Task:** Set up staging environment
- [ ] **Deploy Task:** Configure environment variables
- [ ] **Deploy Task:** Set up database migrations
- [ ] **Deploy Task:** Deploy MVP to staging
- [ ] **Deploy Task:** Verify deployment works
- [ ] **Deploy Task:** Set up error monitoring (Sentry, etc.)

---

## Notes

- Tasks should be completed sequentially within each story
- Stories should be completed in order (SHX-207 through SHX-217)
- All tasks must include commit with Linear story ID in message
- No PR should be opened until all tasks for a story are complete
- Testing and documentation tasks can be done in parallel with implementation
