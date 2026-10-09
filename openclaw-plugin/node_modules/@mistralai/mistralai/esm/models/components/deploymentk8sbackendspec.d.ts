import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
/**
 * Worker configuration for the Kubernetes backend.
 */
export type DeploymentK8sBackendSpec = {
    type: "kubernetes";
    /**
     * Either a 'module:function' reference (e.g. 'worker:main') or a '.py' script path relative to 'working_dir'.
     */
    entrypoint?: string | null | undefined;
    /**
     * Path in the repo holding the worker's pyproject.toml, for monorepo layouts. Leave empty for single-package repos.
     */
    workingDir?: string | null | undefined;
};
/** @internal */
export declare const DeploymentK8sBackendSpec$inboundSchema: z.ZodType<DeploymentK8sBackendSpec, unknown>;
/** @internal */
export type DeploymentK8sBackendSpec$Outbound = {
    type: "kubernetes";
    entrypoint?: string | null | undefined;
    working_dir?: string | null | undefined;
};
/** @internal */
export declare const DeploymentK8sBackendSpec$outboundSchema: z.ZodType<DeploymentK8sBackendSpec$Outbound, DeploymentK8sBackendSpec>;
export declare function deploymentK8sBackendSpecToJSON(deploymentK8sBackendSpec: DeploymentK8sBackendSpec): string;
export declare function deploymentK8sBackendSpecFromJSON(jsonString: string): SafeParseResult<DeploymentK8sBackendSpec, SDKValidationError>;
//# sourceMappingURL=deploymentk8sbackendspec.d.ts.map