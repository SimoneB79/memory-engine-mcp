import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { DeploymentWorkerResponse } from "./deploymentworkerresponse.js";
export type DeploymentWorkerListResponse = {
    /**
     * Workers registered for the deployment
     */
    workers: Array<DeploymentWorkerResponse>;
    /**
     * Cursor for the next page of results
     */
    nextCursor: string | null;
};
/** @internal */
export declare const DeploymentWorkerListResponse$inboundSchema: z.ZodType<DeploymentWorkerListResponse, unknown>;
export declare function deploymentWorkerListResponseFromJSON(jsonString: string): SafeParseResult<DeploymentWorkerListResponse, SDKValidationError>;
//# sourceMappingURL=deploymentworkerlistresponse.d.ts.map