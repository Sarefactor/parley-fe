<script lang="ts">
	import { untrack } from 'svelte';
	import Modal from './Modal.svelte';
	import MessageField from './MessageField.svelte';
	import RuleFields from './RuleFields.svelte';
	import VariablePicker from './VariablePicker.svelte';
	import VariablesEditor from './VariablesEditor.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';
	import { NodeType } from '$lib/config-builder/node-types';
	import { choiceValidationOptions, httpMethodOptions, variableTypeOptions } from '$lib/config-builder/enum-options';
	import {
		emptyValidationRule,
		schema,
		type CatFactsNodeOptions,
		type ChoiceNodeOptions,
		type ClassificationNodeOptions,
		type ConfirmationNodeOptions,
		type GenerationNodeOptions,
		type HttpRequestNodeOptions,
		type InputNodeOptions,
		type MessageNodeOptions
	} from '$lib/stores/agent-schema-store.svelte';
	import { VariableDataType } from '$parleyts/variable-data-type';
	import { WorkflowErrorType } from '$parleyts/workflow-error-type';

	let { nodeId }: { nodeId: string } = $props();

	const config = $derived(schema.getNode(nodeId));
	const allVariables = $derived(schema.getAllVariables());

	// Initial selection only — the modal is remounted per node.
	let selectedRule = $state(
		(schema.getNode(untrack(() => nodeId))?.validationRules.length ?? 0) > 0 ? 0 : -1
	);

	// Input node variables cannot be objects.
	const inputVariableTypeOptions = variableTypeOptions.filter(
		(o) => o.value !== VariableDataType.Object
	);

	// Node types whose targetKey always mirrors the name of their single variable.
	const mirroredTargetKeyTypes: string[] = [
		NodeType.Input,
		NodeType.Confirmation,
		NodeType.Choice,
		NodeType.Generation,
		NodeType.CatFacts
	];

	$effect(() => {
		if (!config || !mirroredTargetKeyTypes.includes(config.nodeType)) return;
		const options = config.nodeOptions as
			| InputNodeOptions
			| ConfirmationNodeOptions
			| ChoiceNodeOptions
			| GenerationNodeOptions
			| CatFactsNodeOptions;
		const name = config.nodeVariables[0]?.name ?? '';
		if (options.targetKey !== name) options.targetKey = name;
	});

	let newChoice = $state('');

	// Http request node draft rows.
	let newHeaderKey = $state('');
	let newHeaderValue = $state('');
	let newParameterName = $state('');
	let newParameterTarget = $state('');
	let newSourcePath = $state('');
	let newMappingTarget = $state('');

	function httpOptions(): HttpRequestNodeOptions | null {
		return config?.nodeType === NodeType.HttpRequest
			? (config.nodeOptions as HttpRequestNodeOptions)
			: null;
	}

	function addHeader(): void {
		const options = httpOptions();
		const key = newHeaderKey.trim();
		if (!options || !key) return;
		options.headers[key] = newHeaderValue;
		newHeaderKey = '';
		newHeaderValue = '';
	}

	function renameHeader(oldKey: string, newKey: string): void {
		const options = httpOptions();
		if (!options) return;
		options.headers = Object.fromEntries(
			Object.entries(options.headers).map(([key, value]) =>
				key === oldKey ? ([newKey, value] as [string, string]) : ([key, value] as [string, string])
			)
		);
	}

	function deleteHeader(key: string): void {
		const options = httpOptions();
		if (options) delete options.headers[key];
	}

	function addParameter(): void {
		const options = httpOptions();
		const name = newParameterName.trim();
		if (!options || !name) return;
		options.requestParameters.push({ parameterName: name, targetKey: newParameterTarget });
		newParameterName = '';
		newParameterTarget = '';
	}

	function addMapping(): void {
		const options = httpOptions();
		const path = newSourcePath.trim();
		if (!options || !path) return;
		options.responseMappings.push({ sourcePath: path, targetKey: newMappingTarget });
		newSourcePath = '';
		newMappingTarget = '';
	}

	function addChoice(): void {
		const value = newChoice.trim();
		if (!config || !value) return;
		(config.nodeOptions as ChoiceNodeOptions).choices.push(value);
		newChoice = '';
	}

	function addRule(): void {
		if (!config) return;
		config.validationRules.push(emptyValidationRule());
		selectedRule = config.validationRules.length - 1;
	}

	function removeRule(): void {
		if (!config) return;
		config.validationRules.splice(selectedRule, 1);
		selectedRule = Math.min(selectedRule, config.validationRules.length - 1);
	}

	const title = $derived.by(() => {
		switch (config?.nodeType) {
			case NodeType.Execution:
				return 'Execution Node';
			case NodeType.Completion:
				return 'Completion Node';
			case NodeType.Message:
				return 'Message Node';
			case NodeType.Input:
				return 'Input Node';
			case NodeType.Confirmation:
				return 'Confirmation Node';
			case NodeType.Choice:
				return 'Choice Node';
			case NodeType.Classification:
				return 'Classification Node';
			case NodeType.HttpRequest:
				return 'Http Request Node';
			case NodeType.Generation:
				return 'Generation Node';
			case NodeType.Transition:
				return 'Transition Node';
			case NodeType.CatFacts:
				return 'Cat Facts Node';
			default:
				return 'Node';
		}
	});
</script>

<Modal
	{title}
	tall={config?.nodeType === NodeType.Message}
	wide={config?.nodeType === NodeType.HttpRequest}
	errors={schema.nodeErrorMessages(nodeId, WorkflowErrorType.Config)}
	onclose={() => schema.closeModal()}
>
	{#if config}
		<p class="muted">Node Id: {config.nodeId}</p>

		{#if config.nodeType === NodeType.Message}
			{@const options = config.nodeOptions as MessageNodeOptions}
			<div class="field">
				<span>Message</span>
				<MessageField bind:value={options.message} variables={allVariables} />
			</div>
		{:else if config.nodeType === NodeType.Input}
			{@const options = config.nodeOptions as InputNodeOptions}
			<div class="field">
				<span>Message</span>
				<MessageField bind:value={options.message} variables={allVariables} />
			</div>
			<div class="field">
				<span>Error Message</span>
				<MessageField bind:value={options.errorMessage} variables={allVariables} />
			</div>

			{#if config.nodeVariables[0]}
				<h3>Variable</h3>
				<label class="field">
					<span>Name</span>
					<input bind:value={config.nodeVariables[0].name} />
				</label>
				<label class="field">
					<span>Description</span>
					<input bind:value={config.nodeVariables[0].description} />
				</label>
				<label class="field">
					<span>Type</span>
					<select bind:value={config.nodeVariables[0].type}>
						{#each inputVariableTypeOptions as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</label>

				<h3>Validation Rules</h3>
				{#if config.validationRules.length === 0}
					<div class="empty-box">
						<button type="button" class="btn" onclick={addRule}>Add Validation Rule</button>
					</div>
				{:else}
					<div class="rule-toolbar">
						<select bind:value={selectedRule} aria-label="Validation rule">
							{#each config.validationRules as _, i (i)}
								<option value={i}>Rule {i + 1}</option>
							{/each}
						</select>
						<button type="button" class="btn" onclick={addRule}>Add New</button>
					</div>
					{#if selectedRule >= 0 && config.validationRules[selectedRule]}
						<hr class="dashed" />
						<RuleFields
							bind:rule={config.validationRules[selectedRule]}
							varType={config.nodeVariables[0].type}
						/>
						<div class="rule-footer">
							<button type="button" class="danger" onclick={removeRule}>Remove Rule</button>
						</div>
					{/if}
				{/if}
			{/if}
		{:else if config.nodeType === NodeType.Confirmation}
			{@const options = config.nodeOptions as ConfirmationNodeOptions}
			<div class="field">
				<span>Message</span>
				<MessageField bind:value={options.message} variables={allVariables} />
			</div>
			{#if config.nodeVariables[0]}
				<h3>Variable</h3>
				<label class="field">
					<span>Name</span>
					<input bind:value={config.nodeVariables[0].name} />
				</label>
				<label class="field">
					<span>Description</span>
					<input bind:value={config.nodeVariables[0].description} />
				</label>
			{/if}
		{:else if config.nodeType === NodeType.Choice}
			{@const options = config.nodeOptions as ChoiceNodeOptions}
			<div class="field">
				<span>Message</span>
				<MessageField bind:value={options.message} variables={allVariables} />
			</div>
			<div class="field">
				<span>Error Message</span>
				<MessageField bind:value={options.errorMessage} variables={allVariables} />
			</div>

			{#if config.nodeVariables[0]}
				<h3>Variable</h3>
				<label class="field">
					<span>Name</span>
					<input bind:value={config.nodeVariables[0].name} />
				</label>
				<label class="field">
					<span>Description</span>
					<input bind:value={config.nodeVariables[0].description} />
				</label>
			{/if}

			<h3>Choices</h3>
			{#each options.choices as _, i (i)}
				<div class="choice-row">
					<input bind:value={options.choices[i]} aria-label={`Choice ${i + 1}`} />
					<button
						type="button"
						class="choice-delete"
						onclick={() => options.choices.splice(i, 1)}
						aria-label={`Delete choice ${i + 1}`}
					>
						<X size={14} />
					</button>
				</div>
			{/each}
			<div class="choice-row new">
				<input
					bind:value={newChoice}
					placeholder="New choice…"
					aria-label="New choice"
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							addChoice();
						}
					}}
				/>
				<button
					type="button"
					class="choice-add"
					onclick={addChoice}
					disabled={!newChoice.trim()}
					aria-label="Add choice"
				>
					<Plus size={16} strokeWidth={3} />
				</button>
			</div>

			<label class="field validation-type">
				<span>Validation Type</span>
				<select bind:value={options.validationType}>
					{#each choiceValidationOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</label>
		{:else if config.nodeType === NodeType.Classification}
			{@const options = config.nodeOptions as ClassificationNodeOptions}
			<div class="field">
				<span>Target Key</span>
				<VariablePicker bind:value={options.targetKey} variables={allVariables} mode="strings" />
			</div>

			<h3>Classification Variables</h3>
			<VariablesEditor bind:variables={config.nodeVariables} />
		{:else if config.nodeType === NodeType.HttpRequest}
			{@const options = config.nodeOptions as HttpRequestNodeOptions}
			<label class="field">
				<span>Url</span>
				<input bind:value={options.url} />
			</label>
			<label class="field">
				<span>Method Type</span>
				<select bind:value={options.methodType}>
					{#each httpMethodOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</label>

			<h3>Headers</h3>
			{#each Object.entries(options.headers) as [headerKey, headerValue], i (i)}
				<div class="pair-row">
					<input
						value={headerKey}
						aria-label={`Header ${i + 1} key`}
						oninput={(e) => renameHeader(headerKey, e.currentTarget.value)}
					/>
					<input
						value={headerValue}
						aria-label={`Header ${i + 1} value`}
						oninput={(e) => (options.headers[headerKey] = e.currentTarget.value)}
					/>
					<button
						type="button"
						class="pair-delete"
						onclick={() => deleteHeader(headerKey)}
						aria-label={`Delete header ${i + 1}`}
					>
						<X size={14} />
					</button>
				</div>
			{/each}
			<div class="pair-row new">
				<input bind:value={newHeaderKey} placeholder="Header…" aria-label="New header key" />
				<input bind:value={newHeaderValue} placeholder="Value…" aria-label="New header value" />
				<button
					type="button"
					class="choice-add"
					onclick={addHeader}
					disabled={!newHeaderKey.trim()}
					aria-label="Add header"
				>
					<Plus size={16} strokeWidth={3} />
				</button>
			</div>

			<label class="field">
				<span>Content Type</span>
				<input bind:value={options.contentType} />
			</label>
			<label class="field">
				<span>Timeout Seconds</span>
				<input type="number" min="1" bind:value={options.timeoutSeconds} />
			</label>

			<h3>Request Parameters</h3>
			{#each options.requestParameters as _, i (i)}
				<div class="pair-row">
					<input
						bind:value={options.requestParameters[i].parameterName}
						aria-label={`Parameter ${i + 1} name`}
					/>
					<VariablePicker
						bind:value={options.requestParameters[i].targetKey}
						variables={allVariables}
						mode="non-object"
						placeholder="Target key…"
					/>
					<button
						type="button"
						class="pair-delete"
						onclick={() => options.requestParameters.splice(i, 1)}
						aria-label={`Delete parameter ${i + 1}`}
					>
						<X size={14} />
					</button>
				</div>
			{/each}
			<div class="pair-row new">
				<input
					bind:value={newParameterName}
					placeholder="Parameter name…"
					aria-label="New parameter name"
				/>
				<VariablePicker
					bind:value={newParameterTarget}
					variables={allVariables}
					mode="non-object"
					placeholder="Target key…"
				/>
				<button
					type="button"
					class="choice-add"
					onclick={addParameter}
					disabled={!newParameterName.trim()}
					aria-label="Add request parameter"
				>
					<Plus size={16} strokeWidth={3} />
				</button>
			</div>

			<h3>Response Mappings</h3>
			{#each options.responseMappings as _, i (i)}
				<div class="pair-row">
					<input
						bind:value={options.responseMappings[i].sourcePath}
						aria-label={`Mapping ${i + 1} source path`}
					/>
					<VariablePicker
						bind:value={options.responseMappings[i].targetKey}
						variables={allVariables}
						mode="non-object"
						placeholder="Target key…"
					/>
					<button
						type="button"
						class="pair-delete"
						onclick={() => options.responseMappings.splice(i, 1)}
						aria-label={`Delete mapping ${i + 1}`}
					>
						<X size={14} />
					</button>
				</div>
			{/each}
			<div class="pair-row new">
				<input
					bind:value={newSourcePath}
					placeholder="Source path…"
					aria-label="New source path"
				/>
				<VariablePicker
					bind:value={newMappingTarget}
					variables={allVariables}
					mode="non-object"
					placeholder="Target key…"
				/>
				<button
					type="button"
					class="choice-add"
					onclick={addMapping}
					disabled={!newSourcePath.trim()}
					aria-label="Add response mapping"
				>
					<Plus size={16} strokeWidth={3} />
				</button>
			</div>

			<h3>Request Response Variables</h3>
			<VariablesEditor bind:variables={config.nodeVariables} />
		{:else if config.nodeType === NodeType.Generation}
			{@const options = config.nodeOptions as GenerationNodeOptions}
			<div class="field">
				<span>Prompt</span>
				<MessageField bind:value={options.message} variables={allVariables} />
			</div>
			{#if config.nodeVariables[0]}
				<h3>Variable</h3>
				<label class="field">
					<span>Name</span>
					<input bind:value={config.nodeVariables[0].name} />
				</label>
				<label class="field">
					<span>Description</span>
					<input bind:value={config.nodeVariables[0].description} />
				</label>
			{/if}
		{:else if config.nodeType === NodeType.CatFacts}
			{@const options = config.nodeOptions as CatFactsNodeOptions}
			<label class="field">
				<span>Max Length</span>
				<input type="number" min="1" bind:value={options.maxLength} />
			</label>
			{#if config.nodeVariables[0]}
				<h3>Variable</h3>
				<label class="field">
					<span>Name</span>
					<input bind:value={config.nodeVariables[0].name} />
				</label>
				<label class="field">
					<span>Description</span>
					<input bind:value={config.nodeVariables[0].description} />
				</label>
			{/if}
		{:else if config.nodeType === NodeType.Transition}
			<p class="muted">
				This node has no options. Connect its lower output connector to other nodes, then click a
				connection to configure that transition's rules.
			</p>
		{:else}
			<p class="muted">This node has no configurable options.</p>
		{/if}
	{/if}
</Modal>

<style>
	.muted {
		color: var(--text-dim);
		font-size: 0.8rem;
		margin: 0 0 0.75rem;
	}

	h3 {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-dim);
		margin: 1.25rem 0 0.6rem;
	}

	.empty-box {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100px;
		border: 1px dashed var(--border-subtle);
		border-radius: 8px;
	}

	.rule-toolbar {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.rule-toolbar select {
		flex: 1;
		background: var(--bg);
		border: 1px solid var(--border-subtle);
		color: var(--text);
		border-radius: 6px;
		padding: 0.45rem 0.6rem;
		font: inherit;
		font-size: 0.85rem;
	}

	.rule-toolbar select:focus {
		outline: 1px solid var(--accent-soft);
	}

	hr.dashed {
		border: none;
		border-top: 1px dashed var(--border-subtle);
		margin: 0.75rem 0;
	}

	.rule-footer {
		margin-top: 0.5rem;
		display: flex;
		justify-content: flex-end;
	}

	.choice-row {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.choice-row input {
		flex: 1;
		background: var(--bg);
		border: 1px solid var(--border-subtle);
		color: var(--text);
		border-radius: 6px;
		padding: 0.45rem 2.2rem 0.45rem 0.6rem;
		font: inherit;
		font-size: 0.85rem;
	}

	.choice-row input:focus {
		outline: 1px solid var(--accent-soft);
	}

	.choice-delete {
		position: absolute;
		right: 0.45rem;
		top: 50%;
		transform: translateY(-50%);
		display: none;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		color: #e07878;
		cursor: pointer;
		padding: 0.15rem;
		border-radius: 4px;
	}

	.choice-row:hover .choice-delete {
		display: flex;
	}

	.choice-delete:hover {
		background: rgba(224, 120, 120, 0.12);
	}

	.choice-add {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		flex-shrink: 0;
		background: transparent;
		border: 1px solid var(--accent-soft);
		color: var(--accent);
		border-radius: 6px;
		cursor: pointer;
	}

	.choice-add:hover:not(:disabled) {
		background: rgba(79, 143, 230, 0.12);
	}

	.choice-add:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.validation-type {
		margin-top: 1rem;
	}

	.pair-row {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.pair-row > input {
		flex: 1;
		min-width: 0;
		background: var(--bg);
		border: 1px solid var(--border-subtle);
		color: var(--text);
		border-radius: 6px;
		padding: 0.45rem 0.6rem;
		font: inherit;
		font-size: 0.85rem;
	}

	.pair-row > input:focus {
		outline: 1px solid var(--accent-soft);
	}

	.pair-row :global(.picker) {
		flex: 1;
		min-width: 0;
	}

	.pair-delete {
		position: absolute;
		right: 0.45rem;
		top: 50%;
		transform: translateY(-50%);
		display: none;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		color: #e07878;
		cursor: pointer;
		padding: 0.15rem;
		border-radius: 4px;
		z-index: 5;
	}

	.pair-row:hover .pair-delete {
		display: flex;
	}

	.pair-delete:hover {
		background: rgba(224, 120, 120, 0.12);
	}
</style>
