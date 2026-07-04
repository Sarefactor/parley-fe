/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { StringComparisonType } from "./string-comparison-type";
import { NumberComparisonType } from "./number-comparison-type";
import { BoolComparisonType } from "./bool-comparison-type";

export class ValidationRuleDto {
    stringComparisonType: StringComparisonType;
    matchString: string;
    regexString: string;
    numberComparisonType: NumberComparisonType;
    matchInt: number;
    boolComparisonType: BoolComparisonType;
    matchBool: boolean;
    matchDateTime: Date;
}
