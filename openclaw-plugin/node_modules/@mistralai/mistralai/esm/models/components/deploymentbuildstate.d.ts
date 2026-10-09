import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type DeploymentBuildState = {
    phase?: string | null | undefined;
    commitSha?: string | null | undefined;
    image?: string | null | undefined;
    message?: string | null | undefined;
    startedAt?: Date | null | undefined;
    finishedAt?: Date | null | undefined;
};
/** @internal */
export declare const DeploymentBuildState$inboundSchema: z.ZodType<DeploymentBuildState, unknown>;
export declare function deploymentBuildStateFromJSON(jsonString: string): SafeParseResult<DeploymentBuildState, SDKValidationError>;
//# sourceMappingURL=deploymentbuildstate.d.ts.map