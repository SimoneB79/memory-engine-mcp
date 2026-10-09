import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { DeploymentLocation } from "./deploymentlocation.js";
import { DeploymentWorkerResponse } from "./deploymentworkerresponse.js";
import { LocationType } from "./locationtype.js";
import { ManagedDeploymentResponse } from "./manageddeploymentresponse.js";
export type DeploymentDetailResponse = {
    /**
     * Unique identifier of the deployment
     */
    id: string;
    /**
     * Deployment name
     */
    name: string;
    /**
     * Whether at least one worker is currently live
     */
    isActive: boolean;
    /**
     * Whether the deployment only accepts registrations from authorized principals
     */
    isHardened: boolean;
    /**
     * When the deployment was first registered
     */
    createdAt: Date;
    /**
     * When the deployment was last updated
     */
    updatedAt: Date;
    /**
     * User id that owns the deployment, or null when it is administrator-managed
     */
    owner?: string | null | undefined;
    /**
     * Where the deployment is running
     *
     * @deprecated field: This will be removed in a future release, please migrate away from it as soon as possible.
     */
    location?: DeploymentLocation | null | undefined;
    /**
     * Number of workers registered to the deployment
     */
    workerCount: number;
    /**
     * Number of workers currently live within the liveness cutoff
     */
    activeWorkerCount: number;
    /**
     * Distinct location types reported by the deployment's workers
     */
    locations?: Array<LocationType> | undefined;
    /**
     * Live managed service state for managed deployments; null for self-hosted deployments or when managed services are unavailable
     */
    managed?: ManagedDeploymentResponse | null | undefined;
    /**
     * Workers registered for the deployment
     */
    workers: Array<DeploymentWorkerResponse>;
};
/** @internal */
export declare const DeploymentDetailResponse$inboundSchema: z.ZodType<DeploymentDetailResponse, unknown>;
export declare function deploymentDetailResponseFromJSON(jsonString: string): SafeParseResult<DeploymentDetailResponse, SDKValidationError>;
//# sourceMappingURL=deploymentdetailresponse.d.ts.map