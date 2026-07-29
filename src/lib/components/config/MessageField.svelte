<script lang="ts">
	import { VariableDataType } from '$parleyts/variable-data-type';
	import type { WorkflowVariableDto } from '$parleyts/workflow-variable-dto';

	interface Suggestion {
		insert: string;
		label: string;
		drill: boolean;
	}

	let {
		value = $bindable(''),
		variables,
		rows = 4,
		placeholder = ''
	}: {
		value?: string;
		variables: WorkflowVariableDto[];
		rows?: number;
		placeholder?: string;
	} = $props();

	let textarea: HTMLTextAreaElement | undefined = $state();
	let open = $state(false);
	let query = $state('');
	let bracketIndex = $state(-1);
	let highlighted = $state(0);

	/** Re-evaluates whether the caret sits inside an unclosed [ ... ] expression. */
	function refresh(): void {
		if (!textarea) return;
		const caret = textarea.selectionStart;
		const before = value.slice(0, caret);
		const lb = before.lastIndexOf('[');
		if (lb === -1 || before.slice(lb + 1).includes(']')) {
			open = false;
			return;
		}
		bracketIndex = lb;
		query = before.slice(lb + 1);
		highlighted = 0;
		open = true;
	}

	const suggestions: Suggestion[] = $derived.by(() => {
		if (!open) return [];
		const usable = variables.filter((v) => v.name);
		const colon = query.indexOf(':');
		if (colon >= 0) {
			// [object:property...] — suggest the object's properties.
			const varName = query.slice(0, colon);
			const propQuery = query.slice(colon + 1).toLowerCase();
			const parent = usable.find((v) => v.name === varName && v.type === VariableDataType.Object);
			if (!parent) return [];
			return parent.objectVariables
				.filter((p) => p.name && p.name.toLowerCase().includes(propQuery))
				.map((p) => ({ insert: `${varName}:${p.name}`, label: p.name, drill: false }));
		}
		const q = query.toLowerCase();
		return usable
			.filter((v) => v.name.toLowerCase().includes(q))
			.map((v) => ({
				insert: v.name,
				label: v.name,
				drill: v.type === VariableDataType.Object
			}));
	});

	function pick(suggestion: Suggestion): void {
		if (!textarea) return;
		const caret = textarea.selectionStart;
		// Objects drill into property selection; everything else completes the brackets.
		const insertText = suggestion.drill ? `${suggestion.insert}:` : `${suggestion.insert}]`;
		value = value.slice(0, bracketIndex + 1) + insertText + value.slice(caret);
		const newCaret = bracketIndex + 1 + insertText.length;
		if (suggestion.drill) {
			query = insertText;
			highlighted = 0;
		} else {
			open = false;
		}
		requestAnimationFrame(() => {
			textarea?.focus();
			textarea?.setSelectionRange(newCaret, newCaret);
		});
	}

	function onkeydown(event: KeyboardEvent): void {
		if (!open || suggestions.length === 0) return;
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			highlighted = (highlighted + 1) % suggestions.length;
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			highlighted = (highlighted - 1 + suggestions.length) % suggestions.length;
		} else if (event.key === 'Enter' || event.key === 'Tab') {
			event.preventDefault();
			pick(suggestions[highlighted]);
		} else if (event.key === 'Escape') {
			event.stopPropagation();
			open = false;
		}
	}
</script>

<div class="message-field">
	<textarea
		bind:this={textarea}
		bind:value
		{rows}
		{placeholder}
		oninput={refresh}
		onclick={refresh}
		{onkeydown}
		onblur={() => setTimeout(() => (open = false), 150)}
	></textarea>
	{#if open && suggestions.length > 0}
		<ul class="suggestions" role="listbox">
			{#each suggestions as suggestion, i (suggestion.insert)}
				<li role="option" aria-selected={i === highlighted}>
					<button
						type="button"
						class:highlighted={i === highlighted}
						onmousedown={(e) => {
							e.preventDefault();
							pick(suggestion);
						}}
					>
						{suggestion.label}{#if suggestion.drill}<span class="drill">:…</span>{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.message-field {
		position: relative;
	}

	textarea {
		width: 100%;
		resize: vertical;
	}

	.suggestions {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		z-index: 20;
		margin: 0.15rem 0 0;
		padding: 0.25rem;
		list-style: none;
		max-height: 180px;
		overflow-y: auto;
		background: var(--bg-titlebar);
		border: 1px solid var(--accent-soft);
		border-radius: 6px;
	}

	.suggestions button {
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

	.suggestions button:hover,
	.suggestions button.highlighted {
		background: rgba(79, 143, 230, 0.18);
	}

	.drill {
		color: var(--text-dim);
	}
</style>
