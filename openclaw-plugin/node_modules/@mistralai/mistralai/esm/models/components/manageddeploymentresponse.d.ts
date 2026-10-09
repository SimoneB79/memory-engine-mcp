import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { DeploymentObservedState } from "./deploymentobservedstate.js";
import { DeploymentResourceConfig } from "./deploymentresourceconfig.js";
import { DeploymentWorkerSpecResponse } from "./deploymentworkerspecresponse.js";
export type ManagedDeploymentResponse = {
    serviceId: string;
    name: string;
    spec: DeploymentWorkerSpecResponse;
    resources: DeploymentResourceConfig;
    status: DeploymentObservedState;
    createdAt: Date;
    updatedAt: Date;
    stopped: boolean;
    rolloutStatus?: string | null | undefined;
    createdBy?: string | null | undefined;
    updatedBy?: string | null | undefined;
    deployedBy?: string | null | undefined;
    deployedAt?: Date | null | undefined;
    isHardened: boolean;
};
/** @internal */
export declare const ManagedDeploymentResponse$inboundSchema: z.ZodType<ManagedDeploymentResponse, unknown>;
export declare function managedDeploymentResponseFromJSON(jsonString: string): SafeParseResult<ManagedDeploymentResponse, SDKValidationError>;
//# sourceMappingURL=manageddeploymentresponse.d.ts.map