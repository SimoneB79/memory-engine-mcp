import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { DeploymentLogRecord } from "./deploymentlogrecord.js";
export type DeploymentLogSearchResponse = {
    results: Array<DeploymentLogRecord>;
    nextCursor?: string | null | undefined;
};
/** @internal */
export declare const DeploymentLogSearchResponse$inboundSchema: z.ZodType<DeploymentLogSearchResponse, unknown>;
export declare function deploymentLogSearchResponseFromJSON(jsonString: string): SafeParseResult<DeploymentLogSearchResponse, SDKValidationError>;
//# sourceMappingURL=deploymentlogsearchresponse.d.ts.map