<script lang="ts">
	import {
		boolComparisonOptions,
		numberComparisonOptions,
		stringComparisonOptions
	} from '$lib/config-builder/enum-options';
	import { BoolComparisonType } from '$parleyts/bool-comparison-type';
	import { NumberComparisonType } from '$parleyts/number-comparison-type';
	import { StringComparisonType } from '$parleyts/string-comparison-type';
	import type { ValidationRuleDto } from '$parleyts/validation-rule-dto';
	import { VariableDataType } from '$parleyts/variable-data-type';

	let { rule = $bindable(), varType }: { rule: ValidationRuleDto; varType: VariableDataType } =
		$props();

	function toLocalInput(date: Date): string {
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
	}

	const dateValue = $derived(rule.matchDateTime ? toLocalInput(new Date(rule.matchDateTime)) : '');

	// Has Value / Has No Value comparisons don't compare against anything,
	// so the match inputs are hidden for them.
	const stringNeedsValue = $derived(
		rule.stringComparisonType !== StringComparisonType.HasValue &&
			rule.stringComparisonType !== StringComparisonType.HasNoValue
	);
	const numberNeedsValue = $derived(
		rule.numberComparisonType !== NumberComparisonType.HasValue &&
			rule.numberComparisonType !== NumberComparisonType.HasNoValue
	);
	const boolNeedsValue = $derived(
		rule.boolComparisonType !== BoolComparisonType.HasValue &&
			rule.boolComparisonType !== BoolComparisonType.HasNoValue
	);
	const isRegex = $derived(rule.stringComparisonType === StringComparisonType.Regex);
</script>

{#if varType === VariableDataType.String}
	<label class="field">
		<span>Comparison Type</span>
		<select bind:value={rule.stringComparisonType}>
			{#each stringComparisonOptions as option (option.value)}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	</label>
	{#if stringNeedsValue && !isRegex}
		<label class="field">
			<span>Match String</span>
			<input bind:value={rule.matchString} />
		</label>
	{/if}
	{#if isRegex}
		<label class="field">
			<span>Regex String</span>
			<input bind:value={rule.regexString} />
		</label>
	{/if}
{:else if varType === VariableDataType.Integer}
	<label class="field">
		<span>Comparison Type</span>
		<select bind:value={rule.numberComparisonType}>
			{#each numberComparisonOptions as option (option.value)}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	</label>
	{#if numberNeedsValue}
		<label class="field">
			<span>Match Int</span>
			<input type="number" bind:value={rule.matchInt} />
		</label>
	{/if}
{:else if varType === VariableDataType.Bool}
	<label class="field">
		<span>Comparison Type</span>
		<select bind:value={rule.boolComparisonType}>
			{#each boolComparisonOptions as option (option.value)}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	</label>
	{#if boolNeedsValue}
		<label class="check">
			<input type="checkbox" bind:checked={rule.matchBool} />
			<span>Match Bool</span>
		</label>
	{/if}
{:else if varType === VariableDataType.DateTime}
	<label class="field">
		<span>Comparison Type</span>
		<select bind:value={rule.numberComparisonType}>
			{#each numberComparisonOptions as option (option.value)}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	</label>
	{#if numberNeedsValue}
		<label class="field">
			<span>Match DateTime</span>
			<input
				type="datetime-local"
				value={dateValue}
				oninput={(e) => (rule.matchDateTime = new Date(e.currentTarget.value))}
			/>
		</label>
	{/if}
{:else}
	<p class="muted">Object variables cannot be matched directly — target one of their properties.</p>
{/if}

<style>
	.muted {
		color: var(--text-dim);
		font-size: 0.85rem;
	}
</style>
