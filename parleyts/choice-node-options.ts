/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { MessageNodeOptions } from "./message-node-options";
import { ChoiceValidationType } from "./choice-validation-type";

export class ChoiceNodeOptions extends MessageNodeOptions {
    targetKey: string = "";
    errorMessage: string = "";
    choices: string[] = [];
    validationType: ChoiceValidationType;
}
