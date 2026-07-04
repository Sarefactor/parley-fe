<script lang="ts">
  import { Handle, Position, type NodeProps } from "@xyflow/svelte";
  import BaseNode from "./BaseNode.svelte";
  import { choiceValidationOptions } from "$lib/config-builder/enum-options";
  import {
    schema,
    type ChoiceNodeOptions,
  } from "$lib/stores/agent-schema-store.svelte";

  let { id }: NodeProps = $props();

  const config = $derived(schema.getNode(id));
  const options = $derived(
    config?.nodeOptions as ChoiceNodeOptions | undefined,
  );
  const validationTypeLabel = $derived(
    choiceValidationOptions.find((o) => o.value === options?.validationType)
      ?.label ?? "—",
  );
</script>

<BaseNode nodeId={id} title="Choice Node">
  <div class="opt truncate">
    <span class="key">Message:</span>
    {options?.message || "—"}
  </div>
  <div class="opt">
    <span class="key">Choices:</span>
    {options?.choices.length ?? 0}
  </div>
  <div class="opt">
    <span class="key">Validation Type:</span>
    {validationTypeLabel}
  </div>
</BaseNode>
<Handle type="target" position={Position.Left} />
<Handle type="source" position={Position.Right} id="primary" />

<style>
  .opt.truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .key {
    color: var(--text);
  }
</style>
