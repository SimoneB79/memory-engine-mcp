import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type DeploymentResourceConfig = {
    replicas?: number | null | undefined;
    cpuRequest?: string | null | undefined;
    cpuLimit?: string | null | undefined;
    memoryRequest?: string | null | undefined;
    memoryLimit?: string | null | undefined;
};
/** @internal */
export declare const DeploymentResourceConfig$inboundSchema: z.ZodType<DeploymentResourceConfig, unknown>;
/** @internal */
export type DeploymentResourceConfig$Outbound = {
    replicas?: number | null | undefined;
    cpu_request?: string | null | undefined;
    cpu_limit?: string | null | undefined;
    memory_request?: string | null | undefined;
    memory_limit?: string | null | undefined;
};
/** @internal */
export declare const DeploymentResourceConfig$outboundSchema: z.ZodType<DeploymentResourceConfig$Outbound, DeploymentResourceConfig>;
export declare function deploymentResourceConfigToJSON(deploymentResourceConfig: DeploymentResourceConfig): string;
export declare function deploymentResourceConfigFromJSON(jsonString: string): SafeParseResult<DeploymentResourceConfig, SDKValidationError>;
//# sourceMappingURL=deploymentresourceconfig.d.ts.map