import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { Prompt } from "./prompt.js";
export type ListPromptsResponse = {
    data?: Array<Prompt> | undefined;
    nextPageToken?: string | undefined;
};
/** @internal */
export declare const ListPromptsResponse$inboundSchema: z.ZodType<ListPromptsResponse, unknown>;
export declare function listPromptsResponseFromJSON(jsonString: string): SafeParseResult<ListPromptsResponse, SDKValidationError>;
//# sourceMappingURL=listpromptsresponse.d.ts.map