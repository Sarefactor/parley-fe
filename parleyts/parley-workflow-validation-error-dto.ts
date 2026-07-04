/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { ParleyWorkflowValidationErrorDetailDto } from "./parley-workflow-validation-error-detail-dto";
import { ParleyNodeValidationErrorDto } from "./parley-node-validation-error-dto";

export class ParleyWorkflowValidationErrorDto {
    workflowId: string;
    errorDetails: ParleyWorkflowValidationErrorDetailDto[] = [];
    nodeErrors: ParleyNodeValidationErrorDto[] = [];
}
