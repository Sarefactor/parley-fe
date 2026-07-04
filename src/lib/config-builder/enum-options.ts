import { BoolComparisonType } from '$parleyts/bool-comparison-type';
import { ChoiceValidationType } from '$parleyts/choice-validation-type';
import { HttpMethodType } from '$parleyts/http-method-type';
import { NumberComparisonType } from '$parleyts/number-comparison-type';
import { StringComparisonType } from '$parleyts/string-comparison-type';
import { VariableDataType } from '$parleyts/variable-data-type';

export interface EnumOption {
	value: number;
	label: string;
}

/** Splits a PascalCase enum key into words, e.g. GreaterThanOrEqualTo -> "Greater Than Or Equal To". */
function toLabel(key: string): string {
	return key.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function optionsFrom(enumObject: object): EnumOption[] {
	return Object.entries(enumObject)
		.filter(([, value]) => typeof value === 'number')
		.map(([key, value]) => ({ value: value as number, label: toLabel(key) }));
}

export const stringComparisonOptions: EnumOption[] = optionsFrom(StringComparisonType);
export const numberComparisonOptions: EnumOption[] = optionsFrom(NumberComparisonType);
export const boolComparisonOptions: EnumOption[] = optionsFrom(BoolComparisonType);
export const variableTypeOptions: EnumOption[] = optionsFrom(VariableDataType);
export const choiceValidationOptions: EnumOption[] = optionsFrom(ChoiceValidationType);
export const httpMethodOptions: EnumOption[] = optionsFrom(HttpMethodType);
