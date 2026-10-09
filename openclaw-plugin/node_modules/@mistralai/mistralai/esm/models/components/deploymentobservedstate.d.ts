import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { DeploymentBuildState } from "./deploymentbuildstate.js";
export type DeploymentObservedState = {
    phase?: string | null | undefined;
    availableReplicas: number;
    readyReplicas: number;
    endpoint?: string | null | undefined;
    message?: string | null | undefined;
    lastSeen?: Date | null | undefined;
    deployedRevision?: string | null | undefined;
    generation?: number | null | undefined;
    buildState?: DeploymentBuildState | null | undefined;
};
/** @internal */
export declare const DeploymentObservedState$inboundSchema: z.ZodType<DeploymentObservedState, unknown>;
export declare function deploymentObservedStateFromJSON(jsonString: string): SafeParseResult<DeploymentObservedState, SDKValidationError>;
//# sourceMappingURL=deploymentobservedstate.d.ts.map