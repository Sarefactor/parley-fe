<script lang="ts">
	import { emptyVariable } from '$lib/stores/agent-schema-store.svelte';
	import { variableTypeOptions } from '$lib/config-builder/enum-options';
	import { VariableDataType } from '$parleyts/variable-data-type';
	import type { WorkflowVariableDto } from '$parleyts/workflow-variable-dto';

	let { variables = $bindable() }: { variables: WorkflowVariableDto[] } = $props();

	let selected = $state(variables.length > 0 ? 0 : -1);

	// Object variables themselves cannot be of type Object.
	const objectVariableTypeOptions = variableTypeOptions.filter(
		(o) => o.value !== VariableDataType.Object
	);

	function addVariable(): void {
		variables.push(emptyVariable());
		selected = variables.length - 1;
	}

	function removeVariable(): void {
		variables.splice(selected, 1);
		selected = Math.min(selected, variables.length - 1);
	}

	function addObjectVariable(): void {
		variables[selected].objectVariables.push({
			name: '',
			description: '',
			type: VariableDataType.String,
			isList: false,
			isNullable: false
		});
	}

	function removeObjectVariable(index: number): void {
		variables[selected].objectVariables.splice(index, 1);
	}
</script>

{#if variables.length === 0}
	<div class="empty-box">
		<button type="button" class="btn" onclick={addVariable}>Add Variable</button>
	</div>
{:else}
	<div class="toolbar">
		<select bind:value={selected} aria-label="Variable">
			{#each variables as variable, i (i)}
				<option value={i}>{variable.name || `(unnamed variable ${i + 1})`}</option>
			{/each}
		</select>
		<button type="button" class="btn" onclick={addVariable}>Add New</button>
	</div>

	{#if selected >= 0 && variables[selected]}
		<hr class="dashed" />
		<label class="field">
			<span>Name</span>
			<input bind:value={variables[selected].name} />
		</label>
		<label class="field">
			<span>Description</span>
			<input bind:value={variables[selected].description} />
		</label>
		<label class="field">
			<span>Type</span>
			<select bind:value={variables[selected].type}>
				{#each variableTypeOptions as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</label>
		<label class="check">
			<input type="checkbox" bind:checked={variables[selected].isList} />
			<span>Is List?</span>
		</label>
		<label class="check">
			<input type="checkbox" bind:checked={variables[selected].isNullable} />
			<span>Nullable?</span>
		</label>

		{#if variables[selected].type === VariableDataType.Object}
			<h3>Object Variables</h3>
			{#each variables[selected].objectVariables as _, i (i)}
				<div class="object-var">
					<label class="field">
						<span>Name</span>
						<input bind:value={variables[selected].objectVariables[i].name} />
					</label>
					<label class="field">
						<span>Description</span>
						<input bind:value={variables[selected].objectVariables[i].description} />
					</label>
					<label class="field">
						<span>Type</span>
						<select bind:value={variables[selected].objectVariables[i].type}>
							{#each objectVariableTypeOptions as option (option.value)}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</label>
					<label class="check">
						<input type="checkbox" bind:checked={variables[selected].objectVariables[i].isList} />
						<span>Is List?</span>
					</label>
					<label class="check">
						<input
							type="checkbox"
							bind:checked={variables[selected].objectVariables[i].isNullable}
						/>
						<span>Nullable?</span>
					</label>
					<button type="button" class="danger" onclick={() => removeObjectVariable(i)}>
						Remove
					</button>
				</div>
			{/each}
			<button type="button" class="btn" onclick={addObjectVariable}>Add Object Variable</button>
		{/if}

		<div class="footer">
			<button type="button" class="danger" onclick={removeVariable}>Remove Variable</button>
		</div>
	{/if}
{/if}

<style>
	.empty-box {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 140px;
		border: 1px dashed var(--border-subtle);
		border-radius: 8px;
	}

	.toolbar {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.toolbar select {
		flex: 1;
		background: var(--bg);
		border: 1px solid var(--border-subtle);
		color: var(--text);
		border-radius: 6px;
		padding: 0.45rem 0.6rem;
		font: inherit;
		font-size: 0.85rem;
	}

	.toolbar select:focus {
		outline: 1px solid var(--accent-soft);
	}

	hr.dashed {
		border: none;
		border-top: 1px dashed var(--border-subtle);
		margin: 0.75rem 0;
	}

	h3 {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-dim);
		margin: 1rem 0 0.5rem;
	}

	.object-var {
		border: 1px solid var(--border-subtle);
		border-radius: 8px;
		padding: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.footer {
		margin-top: 1rem;
		display: flex;
		justify-content: flex-end;
	}
</style>
