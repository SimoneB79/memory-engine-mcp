import * as z from "zod/v4";
import * as discriminatedUnionTypes from "../../types/discriminatedUnion.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { DeploymentK8sBackendSpec } from "./deploymentk8sbackendspec.js";
import { DeploymentKoyebBackendSpec } from "./deploymentkoyebbackendspec.js";
import { GitCommitMetadata } from "./gitcommitmetadata.js";
/**
 * Backend-specific configuration. The arm's 'type' says where the worker runs: 'koyeb' or 'kubernetes'.
 */
export type DeploymentWorkerSpecResponseBackendSpec = DeploymentKoyebBackendSpec | DeploymentK8sBackendSpec | discriminatedUnionTypes.Unknown<"type">;
export type DeploymentWorkerSpecResponse = {
    githubUrl: string;
    type: string;
    revision?: string | null | undefined;
    /**
     * Backend-specific configuration. The arm's 'type' says where the worker runs: 'koyeb' or 'kubernetes'.
     */
    backendSpec: DeploymentKoyebBackendSpec | DeploymentK8sBackendSpec | discriminatedUnionTypes.Unknown<"type">;
    restartedAt?: string | null | undefined;
    commit?: GitCommitMetadata | null | undefined;
    /**
     * @deprecated field: This will be removed in a future release, please migrate away from it as soon as possible.
     */
    commitSha: string | null;
    /**
     * @deprecated field: This will be removed in a future release, please migrate away from it as soon as possible.
     */
    entrypoint: string | null;
    /**
     * @deprecated field: This will be removed in a future release, please migrate away from it as soon as possible.
     */
    workingDir: string | null;
};
/** @internal */
export declare const DeploymentWorkerSpecResponseBackendSpec$inboundSchema: z.ZodType<DeploymentWorkerSpecResponseBackendSpec, unknown>;
export declare function deploymentWorkerSpecResponseBackendSpecFromJSON(jsonString: string): SafeParseResult<DeploymentWorkerSpecResponseBackendSpec, SDKValidationError>;
/** @internal */
export declare const DeploymentWorkerSpecResponse$inboundSchema: z.ZodType<DeploymentWorkerSpecResponse, unknown>;
export declare function deploymentWorkerSpecResponseFromJSON(jsonString: string): SafeParseResult<DeploymentWorkerSpecResponse, SDKValidationError>;
//# sourceMappingURL=deploymentworkerspecresponse.d.ts.map