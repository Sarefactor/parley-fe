<script lang="ts">
	import Modal from './Modal.svelte';
	import RuleFields from './RuleFields.svelte';
	import VariablePicker from './VariablePicker.svelte';
	import { emptyValidationRule, schema } from '$lib/stores/agent-schema-store.svelte';
	import type { TransitionRuleDto } from '$parleyts/transition-rule-dto';
	import { VariableDataType } from '$parleyts/variable-data-type';

	let { sourceId, targetId }: { sourceId: string; targetId: string } = $props();

	const transition = $derived(schema.getTransition(sourceId, targetId));
	const allVariables = $derived(schema.getAllVariables());

	function varTypeFor(name: string): VariableDataType {
		return allVariables.find((v) => v.name === name)?.type ?? VariableDataType.String;
	}

	function addRule(): void {
		const rule: TransitionRuleDto = { ...emptyValidationRule(), targetKey: '' };
		transition?.transitionRules.push(rule);
	}
</script>

<Modal title="Configure Transition" onclose={() => schema.closeModal()}>
	{#if transition}
		<p class="muted">Target Node: {targetId}</p>
		<label class="field">
			<span>Priority</span>
			<input type="number" min="1" bind:value={transition.priority} />
		</label>

		<h3>Transition Rules</h3>
		{#each transition.transitionRules as _, i (i)}
			<div class="rule">
				<div class="field">
					<span>Target Key</span>
					<VariablePicker
						bind:value={transition.transitionRules[i].targetKey}
						variables={allVariables}
					/>
				</div>
				<RuleFields
					bind:rule={transition.transitionRules[i]}
					varType={varTypeFor(transition.transitionRules[i].targetKey)}
				/>
				<button type="button" class="danger" onclick={() => transition.transitionRules.splice(i, 1)}>
					Remove Rule
				</button>
			</div>
		{/each}
		<button type="button" class="btn" onclick={addRule}>Add Transition Rule</button>
	{:else}
		<p class="muted">Transition not found.</p>
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

	.rule {
		border: 1px solid var(--border-subtle);
		border-radius: 8px;
		padding: 0.75rem;
		margin-bottom: 0.75rem;
	}
</style>
