<script lang="ts">
	import { VariableDataType } from '$parleyts/variable-data-type';
	import type { WorkflowVariableDto } from '$parleyts/workflow-variable-dto';

	/**
	 * Which variables are offered:
	 * - 'all': every named variable.
	 * - 'strings': string variables plus string properties of object variables
	 *   (`objectVariable:stringProperty`), lists excluded.
	 * - 'non-object': non-object variables of any type plus properties of object
	 *   variables (`objectVariable:property`), lists excluded.
	 */
	type PickerMode = 'all' | 'strings' | 'non-object';

	let {
		value = $bindable(''),
		variables,
		placeholder = 'Select variable…',
		mode = 'all'
	}: {
		value?: string;
		variables: WorkflowVariableDto[];
		placeholder?: string;
		mode?: PickerMode;
	} = $props();

	let open = $state(false);

	const candidates = $derived.by(() => {
		const names: string[] = [];
		for (const variable of variables) {
			if (!variable.name) continue;
			if (mode === 'all') {
				names.push(variable.name);
				continue;
			}
			if (variable.isList) continue;
			if (variable.type === VariableDataType.Object) {
				for (const property of variable.objectVariables ?? []) {
					if (!property.name || property.isList) continue;
					if (mode === 'strings' && property.type !== VariableDataType.String) continue;
					names.push(`${variable.name}:${property.name}`);
				}
			} else {
				if (mode === 'strings' && variable.type !== VariableDataType.String) continue;
				names.push(variable.name);
			}
		}
		return names;
	});

	const filtered = $derived(
		candidates.filter((name) => name.toLowerCase().includes(value.toLowerCase()))
	);
</script>

<div class="picker">
	<input
		bind:value
		{placeholder}
		onfocus={() => (open = true)}
		oninput={() => (open = true)}
		onblur={() => setTimeout(() => (open = false), 150)}
	/>
	{#if open && filtered.length > 0}
		<ul role="listbox">
			{#each filtered as name (name)}
				<li role="option" aria-selected={name === value}>
					<button
						type="button"
						onmousedown={(e) => {
							e.preventDefault();
							value = name;
							open = false;
						}}
					>
						{name}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.picker {
		position: relative;
	}

	input {
		width: 100%;
		background: var(--bg);
		border: 1px solid var(--border-subtle);
		color: var(--text);
		border-radius: 6px;
		padding: 0.45rem 0.6rem;
		font: inherit;
		font-size: 0.85rem;
	}

	input:focus {
		outline: 1px solid var(--accent-soft);
	}

	ul {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		z-index: 20;
		margin: 0.15rem 0 0;
		padding: 0.25rem;
		list-style: none;
		max-height: 160px;
		overflow-y: auto;
		background: var(--bg-titlebar);
		border: 1px solid var(--accent-soft);
		border-radius: 6px;
	}

	ul button {
		display: block;
		width: 100%;
		text-align: left;
		background: transparent;
		border: none;
		color: var(--text);
		padding: 0.35rem 0.5rem;
		border-radius: 4px;
		cursor: pointer;
		font: inherit;
		font-size: 0.85rem;
	}

	ul button:hover {
		background: rgba(79, 143, 230, 0.18);
	}
</style>
