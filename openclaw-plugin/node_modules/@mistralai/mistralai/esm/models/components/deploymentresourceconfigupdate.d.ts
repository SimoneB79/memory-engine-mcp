import * as z from "zod/v4";
export type DeploymentResourceConfigUpdate = {
    replicas?: number | null | undefined;
    cpuRequest?: string | null | undefined;
    cpuLimit?: string | null | undefined;
    memoryRequest?: string | null | undefined;
    memoryLimit?: string | null | undefined;
};
/** @internal */
export type DeploymentResourceConfigUpdate$Outbound = {
    replicas?: number | null | undefined;
    cpu_request?: string | null | undefined;
    cpu_limit?: string | null | undefined;
    memory_request?: string | null | undefined;
    memory_limit?: string | null | undefined;
};
/** @internal */
export declare const DeploymentResourceConfigUpdate$outboundSchema: z.ZodType<DeploymentResourceConfigUpdate$Outbound, DeploymentResourceConfigUpdate>;
export declare function deploymentResourceConfigUpdateToJSON(deploymentResourceConfigUpdate: DeploymentResourceConfigUpdate): string;
//# sourceMappingURL=deploymentresourceconfigupdate.d.ts.map