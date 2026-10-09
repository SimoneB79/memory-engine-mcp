import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { PromptVersion } from "./promptversion.js";
export type ListPromptVersionsResponse = {
    data?: Array<PromptVersion> | undefined;
};
/** @internal */
export declare const ListPromptVersionsResponse$inboundSchema: z.ZodType<ListPromptVersionsResponse, unknown>;
export declare function listPromptVersionsResponseFromJSON(jsonString: string): SafeParseResult<ListPromptVersionsResponse, SDKValidationError>;
//# sourceMappingURL=listpromptversionsresponse.d.ts.map