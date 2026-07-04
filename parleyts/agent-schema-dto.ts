/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { WorkflowSchemaDto } from "./workflow-schema-dto";

export class AgentSchemaDto {
    id: string;
    name: string = "";
    instructions: string = "";
    workflowSchemas: WorkflowSchemaDto[] = [];
}
