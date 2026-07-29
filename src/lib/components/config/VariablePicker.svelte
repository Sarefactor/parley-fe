<script lang="ts">
	import { VariableDataType } from '$parleyts/variable-data-type';
	import type { WorkflowVariableDto } from '$parleyts/workflow-variable-dto';

	/**
	 * Which variables are offered:
	 * - 'all': every named variable.
	 * - 'strings': string variables plus string properties of object variables
	 *   (`objectVariable:stringProperty`).
	 * - 'non-object': non-object variables of any type plus properties of object
	 *   variables (`objectVariable:property`).
	 * - 'lists': list variables of any type (including objects), plus list
	 *   properties of object variables (`objectVariable:listProperty`) — offered
	 *   whether or not the object itself is a list.
	 */
	type PickerMode = 'all' | 'strings' | 'non-object' | 'lists';

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
	let inputEl = $state<HTMLInputElement>();

	// The dropdown is position: fixed so it can escape the modal's scroll
	// container instead of stretching it; anchor it to the input manually.
	let dropdownTop = $state(0);
	let dropdownLeft = $state(0);
	let dropdownWidth = $state(0);

	function updateDropdownPosition(): void {
		if (!inputEl) return;
		const rect = inputEl.getBoundingClientRect();
		dropdownTop = rect.bottom;
		dropdownLeft = rect.left;
		dropdownWidth = rect.width;
	}

	function openDropdown(): void {
		updateDropdownPosition();
		open = true;
	}

	// Keep the dropdown glued to the input if anything scrolls or resizes.
	$effect(() => {
		if (!open) return;
		window.addEventListener('scroll', updateDropdownPosition, true);
		window.addEventListener('resize', updateDropdownPosition);
		return () => {
			window.removeEventListener('scroll', updateDropdownPosition, true);
			window.removeEventListener('resize', updateDropdownPosition);
		};
	});

	const candidates = $derived.by(() => {
		const names: string[] = [];
		for (const variable of variables) {
			if (!variable.name) continue;
			if (mode === 'all') {
				names.push(variable.name);
				continue;
			}
			if (mode === 'lists') {
				if (variable.isList) names.push(variable.name);
				if (variable.type === VariableDataType.Object) {
					for (const property of variable.objectVariables ?? []) {
						if (!property.name || !property.isList) continue;
						names.push(`${variable.name}:${property.name}`);
					}
				}
				continue;
			}
			if (variable.type === VariableDataType.Object) {
				for (const property of variable.objectVariables ?? []) {
					if (!property.name) continue;
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
		bind:this={inputEl}
		{placeholder}
		onfocus={openDropdown}
		oninput={openDropdown}
		onblur={() => setTimeout(() => (open = false), 150)}
	/>
	{#if open && filtered.length > 0}
		<ul
			role="listbox"
			style:top="{dropdownTop}px"
			style:left="{dropdownLeft}px"
			style:width="{dropdownWidth}px"
		>
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
		position: fixed;
		z-index: 60;
		margin: 0.15rem 0 0;
		padding: 0.25rem;
		list-style: none;
		/* Scroll after 5 items: 5 × 30px rows + ul padding + borders. */
		max-height: calc(5 * 30px + 0.5rem + 2px);
		overflow-y: auto;
		background: var(--bg-titlebar);
		border: 1px solid var(--accent-soft);
		border-radius: 6px;
	}

	ul button {
		display: flex;
		align-items: center;
		height: 30px;
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
