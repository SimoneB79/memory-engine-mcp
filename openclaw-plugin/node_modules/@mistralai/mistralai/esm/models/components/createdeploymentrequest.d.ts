import * as z from "zod/v4";
import { DeploymentResourceConfig, DeploymentResourceConfig$Outbound } from "./deploymentresourceconfig.js";
import { DeploymentWorkerSpecInput, DeploymentWorkerSpecInput$Outbound } from "./deploymentworkerspecinput.js";
export type CreateDeploymentRequest = {
    name: string;
    spec: DeploymentWorkerSpecInput;
    resources?: DeploymentResourceConfig | null | undefined;
    hardened?: boolean | undefined;
};
/** @internal */
export type CreateDeploymentRequest$Outbound = {
    name: string;
    spec: DeploymentWorkerSpecInput$Outbound;
    resources?: DeploymentResourceConfig$Outbound | null | undefined;
    hardened: boolean;
};
/** @internal */
export declare const CreateDeploymentRequest$outboundSchema: z.ZodType<CreateDeploymentRequest$Outbound, CreateDeploymentRequest>;
export declare function createDeploymentRequestToJSON(createDeploymentRequest: CreateDeploymentRequest): string;
//# sourceMappingURL=createdeploymentrequest.d.ts.map