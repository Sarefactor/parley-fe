/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { NodeConfigDto } from "./node-config-dto";
import { WorkflowVariableDto } from "./workflow-variable-dto";

export class WorkflowSchemaDto {
    name: string;
    intent: string;
    description: string;
    executionNodeId: string;
    nodes: NodeConfigDto[] = [];
    workflowVariables: WorkflowVariableDto[] = [];
}
