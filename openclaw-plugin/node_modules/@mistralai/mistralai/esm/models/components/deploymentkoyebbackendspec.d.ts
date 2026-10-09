import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
/**
 * Worker configuration for the Koyeb backend.
 */
export type DeploymentKoyebBackendSpec = {
    type: "koyeb";
    /**
     * Docker build context, as a path in the repo. Defaults to the repo root.
     */
    buildDirectory?: string | null | undefined;
    /**
     * Path to the Dockerfile, relative to 'build_directory'. Defaults to 'Dockerfile'.
     */
    dockerfilePath?: string | null | undefined;
};
/** @internal */
export declare const DeploymentKoyebBackendSpec$inboundSchema: z.ZodType<DeploymentKoyebBackendSpec, unknown>;
/** @internal */
export type DeploymentKoyebBackendSpec$Outbound = {
    type: "koyeb";
    build_directory?: string | null | undefined;
    dockerfile_path?: string | null | undefined;
};
/** @internal */
export declare const DeploymentKoyebBackendSpec$outboundSchema: z.ZodType<DeploymentKoyebBackendSpec$Outbound, DeploymentKoyebBackendSpec>;
export declare function deploymentKoyebBackendSpecToJSON(deploymentKoyebBackendSpec: DeploymentKoyebBackendSpec): string;
export declare function deploymentKoyebBackendSpecFromJSON(jsonString: string): SafeParseResult<DeploymentKoyebBackendSpec, SDKValidationError>;
//# sourceMappingURL=deploymentkoyebbackendspec.d.ts.map