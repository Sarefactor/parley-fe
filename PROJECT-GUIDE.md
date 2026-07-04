# Parley Config Builder — Project Guide

A SvelteKit front end for building Parley chat-bot **Agent Schemas**: multi-workflow, node-based
conversation flows edited on a Svelte Flow canvas and persisted to the Parley API. This document
summarises the architecture and conventions, and walks through **how to add a new node type** —
it is intended both as a continuation brief for a fresh session and as onboarding for developers.

---

## 1. Stack

| Thing | Choice |
|---|---|
| Framework | SvelteKit 2 + Svelte 5 (**runes**: `$state`, `$derived`, `$props`, `$bindable`, `$effect`) |
| Language | TypeScript (strict; `strictPropertyInitialization: false` for the TypeGen DTOs) |
| Canvas | `@xyflow/svelte` v1 (Svelte Flow) |
| Icons | `@lucide/svelte` — import per icon: `@lucide/svelte/icons/<name>` |
| Styling | Plain CSS, dark blue theme via CSS variables in `src/app.css` (no Tailwind) |

Commands: `npm run dev`, `npm run check` (svelte-check must stay at 0 errors), `npm run build`.

## 2. Directory map

```
parleyts/                        TypeGen-generated DTOs from the C# backend. NEVER edit by hand.
                                 Served in dev via vite.config.ts -> server.fs.allow: ['parleyts']
                                 and aliased as $parleyts (svelte.config.js kit.alias).
src/
  app.css                        Theme variables + shared form styles (.field, .check, .btn,
                                 .accent-btn, button.danger).
  lib/
    config.ts                    API base url (VITE_API_BASE_URL override) + endpoint builders.
    api/parley-api.ts            Fetch wrappers: searchAgentSchemas, getAgentSchema,
                                 upsertAgentSchema (throws UpsertValidationError on 422),
                                 setActiveSchema.
    config-builder/
      ids.ts                     newUuid() (crypto.randomUUID).
      node-types.ts              NodeType map + defaultPaletteNodes (sidebar palette).
      enum-options.ts            Enum -> {value,label}[] helpers for all dropdowns.
    stores/
      agent-schema-store.svelte.ts   THE central runes store (singleton `schema`). See §4.
    components/config/
      Sidebar.svelte             Collapsible palette + Agent Schema Options button.
      WorkflowCanvas.svelte      Svelte Flow wrapper: nodeTypes map, edge<->DTO sync, DnD.
      Modal.svelte               Generic modal. Props: title, onclose, wide, tall,
                                 errors (read-only red panel rendered beside the modal).
      AgentOptionsModal.svelte / WorkflowOptionsModal.svelte / NodeOptionsModal.svelte /
      TransitionOptionsModal.svelte
      VariablesEditor.svelte     Full workflow-variable editor (dropdown + Add New pattern).
      VariablePicker.svelte      Filterable variable dropdown. mode: 'all'|'strings'|'non-object'.
      MessageField.svelte        Textarea with "[" variable autocomplete (see §6).
      RuleFields.svelte          Comparison-type + match inputs for validation/transition rules.
      nodes/                     One canvas component per node type + BaseNode.svelte.
  routes/
    +page.svelte                 Landing page: paged agent-schema table, row click -> /config?id=…
    config/+page.svelte          The builder page (ssr=false in +page.ts): toolbar, canvas, modals.
```

## 3. Data model (server truth)

`AgentSchemaDto { id, name, instructions, workflowSchemas[] }`
`WorkflowSchemaDto { name, intent, description, executionNodeId, nodes[], workflowVariables[] }`
— **no id property**: a workflow is identified by its `executionNodeId` everywhere (incl. validation).

`NodeConfigDto` (one per canvas node):
- `nodeId` (uuid), `nodeType` (string discriminator, e.g. `"MessageNode"`)
- `primaryTransitionNode` — the default/next node. **Nullable Guid server-side: use `null`, never `''`.**
- `secondaryTransitionNode` — same rules; only some nodes expose a connector for it.
- `nodeOptions` — plain object, shape per node type (`parleyts/*-node-options.ts`).
- `nodeVariables[]`, `transitions[]` (TransitionDto: priority, targetNodeId, transitionRules[]),
  `validationRules[]`, `position {x,y}`.

Variables: `WorkflowVariableDto extends ParleyVariableDto { objectVariables[] }`,
`VariableDataType` = String 1 / Integer 2 / Bool 3 / DateTime 4 / Object 5.
Rules: `ValidationRuleDto` (string/number/bool/date comparison fields);
`TransitionRuleDto extends ValidationRuleDto { targetKey }`.
All comparison enums now include `HasValue` / `HasNoValue` (match inputs hidden for these;
stale values are deliberately kept, not cleared).

### API endpoints (src/lib/config.ts)
- `GET  /api/parley/search?skip&take` → `SearchResultDto<AgentSchemaSearchItemDto>` (page is 0-based here)
- `GET  /api/parley/get?agentSchemaId=<uuid>` → `AgentSchemaDto`
- `POST /api/parley/upsert` (body: AgentSchemaDto) → 200, or **422 + `ParleyValidationContextDto`**
- `POST /api/parley/setActiveSchema?agentSchemaId=<uuid>`

## 4. The store — `agent-schema-store.svelte.ts`

Singleton `schema = new AgentSchemaStore()`, class fields are `$state`. Everything binds straight
into its proxies (modals mutate configs in place; no save/cancel staging).

Key state: `agentId/agentName/agentInstructions`, `workflows: WorkflowDraft[]`, `currentIndex`,
`get workflow()` (current draft), `modal: ModalState`, `validation` (last 422 context).
`WorkflowDraft` mirrors `WorkflowSchemaDto` but keys `nodes` by nodeId (`Record<string, NodeConfigDto>`).

Key methods:
- `createWorkflow()` — pushes a draft with a pre-placed Execution node (one per workflow, undeletable).
- `addNode(nodeType, position)` — creates the `NodeConfigDto` with per-type defaults (see `newNodeConfig`).
- `removeNode(id)` — also nulls dangling primary/secondary refs and strips transitions to it.
- `setPrimaryTransition / setSecondaryTransition (sourceId, targetId|null)`;
  `addTransition / removeTransition / getTransition (sourceId, targetId)`.
- **`getAllVariables()`** — workflow variables + every node's `nodeVariables`, one list. All variable
  pickers/autocompletes feed from this.
- `toAgentSchemaDto()` / `loadFromDto(dto)` (normalises nodes via `normalizeNode`) / `reset()`.
- Dirty tracking: `markClean()` + `get isDirty` (JSON snapshot diff) — used by the back-button
  "Unsaved Changes" confirm.
- Validation (see §8): `setValidation`, `agentErrors`, `hasWorkflowErrors`,
  `workflowErrorsFor(executionNodeId)`, `currentWorkflowErrorMessages(type)`,
  `nodeErrorDetails/nodeErrorMessages(nodeId, type)`.

## 5. Canvas — `WorkflowCanvas.svelte`

- `nodes`/`edges` are `$state.raw` arrays fed to `<SvelteFlow bind:nodes bind:edges>`; node `type`
  is the `NodeConfigDto.nodeType` string, and node components read their config from the store by id
  (flow `data` is unused).
- Seeded on mount from the current draft; the page wraps the canvas in `{#key schema.workflow}` so
  switching/adding workflows remounts it. `buildEdges()` reconstructs edges from
  `primaryTransitionNode` (+ self-ref completion excluded), `secondaryTransitionNode`, `transitions[]`.
- **Connector conventions** (handle ids matter — the sync logic keys off them):
  - `primary` (source, right, top 30% when paired via class `handle-primary`) → single connection →
    `primaryTransitionNode`. Reconnecting replaces the existing edge.
  - `secondary` (source, right, 70%, grey, class `handle-secondary`) → single connection →
    `secondaryTransitionNode`. Used by Confirmation, HttpRequest, Generation.
  - `transitions` (source, right, 70%, grey, class `handle-transitions`, Transition node only) →
    many connections; each creates a `TransitionDto` (auto priority). **Clicking one of these edges
    opens the transition rules modal.**
  - Plain target handle on the left for every node except Execution; Completion has target only
    (its `primaryTransitionNode` = its own id, set at creation).
- Deleting edges/nodes (Del/Backspace) syncs the DTOs in `handleDelete`. Drag-stop syncs positions.
- Palette DnD: sidebar sets `dataTransfer['application/parley-node'] = nodeType`; drop uses
  `screenToFlowPosition`. Handles are enlarged with an invisible `::before` halo and
  `connectionRadius={36}`. Hovered node wrappers get `z-index: 2000 !important` so tooltips/glow
  always render above other nodes.

## 6. Shared editor widgets

- **`MessageField`** — any "message/prompt" textarea. Typing `[` opens a filtered dropdown of
  `getAllVariables()` (lists excluded); selecting inserts `[name]`; picking an Object variable
  inserts `name:` and drills into its (non-list) properties → `[object:property]`.
- **`VariablePicker`** — text input + filtered dropdown, `mode`:
  `'all'` (default), `'strings'` (string vars + string props of objects), `'non-object'`
  (non-object vars of any type + object properties). Bind with `bind:value`.
- **`VariablesEditor`** — the full add/edit UI for `WorkflowVariableDto[]` (used by workflow modal,
  Classification "Classification Variables", HttpRequest "Request Response Variables"). Pass with
  `bind:variables`.
- **`RuleFields`** — `bind:rule` (ValidationRuleDto) + `varType`; renders the right comparison
  dropdown and match input; hides match inputs for HasValue/HasNoValue; Regex String only when
  comparison = Regex (Match String hidden then).
- **`Modal`** — `title, onclose, wide?, tall?` (`tall` reserves 260px for in-field dropdowns —
  used by the Message node modal), `errors?: string[]` renders the red read-only side panel.

## 7. Node options modal — `NodeOptionsModal.svelte`

One component, branches on `config.nodeType`. Patterns in use:
- `{@const options = config.nodeOptions as XxxNodeOptions}` then bind directly.
- **Mirrored targetKey**: for Input, Confirmation, Choice, Generation the options `targetKey` always
  equals `nodeVariables[0].name` — enforced by an `$effect` against `mirroredTargetKeyTypes`; the
  field is never shown.
- Reusable UI patterns: dropdown-+-"Add New" selector (validation rules), choice rows with hover ×
  delete and a `+` add row (`.choice-row`), two-field pair rows (`.pair-row`) for headers /
  request parameters / response mappings.

## 8. Server-side validation (422 flow)

`upsertAgentSchema` throws `UpsertValidationError` carrying `ParleyValidationContextDto`
(`agentErrorMessages: string[]`, `workflowErrors: { workflowId /* = executionNodeId */,
errorDetails: {errorMessage, type}[], nodeErrors: { nodeId, errorDetails }[] }[]`).
`WorkflowErrorType`: Config = 1, Schema = 2.

UI mapping (state lives in `schema.validation`; cleared on successful save / reset / load; it
reflects the **last upsert attempt** — editing doesn't clear indicators):
- Toolbar status text (right of dropdown) turns red: "Upsert Failed: Validation Errors".
- Agent errors → red border on the sidebar "Agent Schema Options" button; messages shown in the
  Modal `errors` side panel of that modal.
- Any workflow errors → red border on the workflow dropdown; affected workflows prefixed "⚠ "
  in the options (native `<option>` can't render real icons).
- Current workflow Config errors → red border on the gear button + side panel in the Configure
  Workflow modal.
- Current workflow Schema errors → red "Workflow Errors" button in a second toolbar row → modal list.
- Node errors → red border on the node (BaseNode). Config-type messages appear beside that node's
  options modal; Schema-type messages appear in a hover tooltip to the right of the node.

## 9. HOW TO ADD A NEW NODE TYPE (checklist)

Assume the backend team added `FooNode` with `parleyts/foo-node-options.ts` (`FooNodeOptions`).
Everything below is mechanical; copy the closest existing node (Confirmation and Choice are good
templates).

1. **`src/lib/config-builder/node-types.ts`**
   - Add `Foo: 'FooNode'` to `NodeType` (string must equal `NodeConfigDto.nodeType` server-side).
   - Add `{ nodeType: NodeType.Foo, label: 'Foo Node' }` to `defaultPaletteNodes` (drag palette).

2. **`src/lib/stores/agent-schema-store.svelte.ts`**
   - Import the options type; add `export type { FooNodeOptions } from '$parleyts/foo-node-options';`
     (components import option types from the store re-exports).
   - `newNodeConfig()`: add a `case NodeType.Foo:` initialising `nodeOptions` with **all** fields
     defaulted (`satisfies FooNodeOptions`) and any fixed `nodeVariables`
     (e.g. `[emptyVariable(VariableDataType.Bool)]` — `emptyVariable()` defaults to String).
   - `normalizeNode()`: add the matching branch — spread defaults under `...node.nodeOptions` and
     guarantee arrays/dictionaries and required `nodeVariables[0]` exist. This protects loading of
     older saved schemas.
   - If the node's targetKey mirrors its single variable name, no store change is needed —
     see step 5.

3. **Canvas component `src/lib/components/config/nodes/FooNode.svelte`**
   ```svelte
   <script lang="ts">
     import { Handle, Position, type NodeProps } from '@xyflow/svelte';
     import BaseNode from './BaseNode.svelte';
     import { schema, type FooNodeOptions } from '$lib/stores/agent-schema-store.svelte';
     let { id }: NodeProps = $props();
     const config = $derived(schema.getNode(id));
     const options = $derived(config?.nodeOptions as FooNodeOptions | undefined);
   </script>

   <BaseNode nodeId={id} title="Foo Node">
     <!-- summary lines; single-line text gets class "opt truncate" -->
   </BaseNode>
   <Handle type="target" position={Position.Left} />
   <Handle type="source" position={Position.Right} id="primary" />
   ```
   - BaseNode provides: header (dbl-click → options modal), clipped body (dbl-click → expand),
     hover glow, red error border, schema-error hover tooltip. Don't reimplement these.
   - Two outputs? Use the paired handles instead of the single one:
     `id="primary" class="handle-primary"` + `id="secondary" class="handle-secondary"`.
     The canvas already persists/restores/deletes both — no further wiring.
   - A many-connection transitions output (`id="transitions" class="handle-transitions"`) is
     currently only meant for the Transition node.

4. **Register it in `WorkflowCanvas.svelte`** — import the component and add
   `[NodeType.Foo]: FooNode` to `nodeTypes`. That's all the canvas needs.

5. **Options UI in `NodeOptionsModal.svelte`**
   - Add a `case NodeType.Foo: return 'Foo Node';` to the `title` switch.
   - Add an `{:else if config.nodeType === NodeType.Foo}` branch before the Transition branch,
     using the shared widgets (§6). Conventions:
     - message-like fields → `MessageField` (`bind:value={options.message}` etc.,
       `variables={allVariables}`).
     - hidden mirrored targetKey → add `NodeType.Foo` to `mirroredTargetKeyTypes` and include the
       options type in the `$effect` cast union; show only Name (+ Description) inputs bound to
       `config.nodeVariables[0]`.
     - explicit targetKey selection → `VariablePicker` with the appropriate `mode`.
     - variable collections → `VariablesEditor bind:variables={config.nodeVariables}`.
     - big/many-field modals → pass `wide` (see HttpRequest); modals whose only field opens a
       dropdown near the bottom may need `tall`.
   - Config-type validation errors appear automatically via the modal's `errors` prop (already
     wired for every node).

6. **Verify** — `npm run check` must be clean; then manually: drag from palette, connect handles,
   save, reload the schema from the landing page and confirm options/edges round-trip.

That is the complete surface: palette entry, store defaults + normalisation, canvas component,
nodeTypes registration, modal branch.

## 10. Quirks & gotchas

- **Nullable Guids**: `primaryTransitionNode`/`secondaryTransitionNode` must be `null` when unset —
  `''` fails ASP.NET `Guid?` binding with a misleading "agentSchemaDto field is required" 422/400.
  The TypeGen types say `string`, hence the `null as unknown as string` casts in the store.
- **TypeGen files** regenerate — never hand-edit; the store's `strictPropertyInitialization: false`
  exists for them. Dev server needs `server.fs.allow: ['parleyts']` (already in vite.config.ts) or
  the browser 403s on those modules → SvelteKit "500 Internal Error" on /config.
- Enum dropdowns are generated from the enum objects (`enum-options.ts`), so new enum members
  appear automatically; labels are PascalCase split ("GreaterThanOrEqualTo" → "Greater Than Or
  Equal To").
- Search paging on the landing page assumes the API's `page` is **0-based** (skip = page × pageSize).
- The store is a module singleton: /config always `reset()`s (no `?id`) or `loadFromDto`s on mount.
- Save button posts the whole AgentSchemaDto (all workflows). "Set Active Schema" posts
  `?agentSchemaId=` — the search endpoint's param naming was assumed consistent; adjust in
  `config.ts` if the backend differs.
- Deliberate UX decisions: hidden rule inputs keep their stale values; validation indicators persist
  until the next save; back-button guard only covers the toolbar list button (not browser back —
  `beforeNavigate` could extend this).

## 11. Possible next steps

- Workflow deletion / rename UI (dropdown currently only selects; drafts can't be removed).
- Wire `beforeNavigate` so browser navigation also triggers the unsaved-changes confirm.
- Multi-select/copy-paste of nodes; canvas mini-map (`<MiniMap/>` from @xyflow/svelte).
- The remaining generated options types not yet surfaced: `bool-node-options.ts`,
  `completion-node-options.ts` / `execution-node-options.ts` / `transition-node-options.ts`
  (all currently empty) — plus whatever new nodes the backend adds next.
- Regenerate TypeGen with nullable annotations so the `null as unknown as string` casts can go.
