/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { WorkflowVariableDto } from "./workflow-variable-dto";
import { TransitionDto } from "./transition-dto";
import { ValidationRuleDto } from "./validation-rule-dto";
import { NodePositionDto } from "./node-position-dto";

export class NodeConfigDto {
    nodeId: string;
    nodeType: string;
    primaryTransitionNode: string;
    secondaryTransitionNode: string;
    nodeOptions: Object = {};
    nodeVariables: WorkflowVariableDto[] = [];
    transitions: TransitionDto[] = [];
    validationRules: ValidationRuleDto[] = [];
    position: NodePositionDto = {"x":0.0,"y":0.0};
}
