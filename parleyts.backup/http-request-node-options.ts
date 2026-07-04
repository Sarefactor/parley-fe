/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { ParleyNodeOptions } from "./parley-node-options";
import { HttpMethodType } from "./http-method-type";
import { ResponseMapping } from "./response-mapping";
import { RequestParameters } from "./request-parameters";

export class HttpRequestNodeOptions extends ParleyNodeOptions {
    url: string;
    methodType: HttpMethodType = 1;
    headers: { [key: string]: string; } = {};
    contentType: string = "application/json";
    responseMappings: ResponseMapping[] = [];
    timeoutSeconds: number = 30;
    requestParameters: RequestParameters[] = [];
}
