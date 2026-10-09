import * as z from "zod/v4";
import { DeploymentResourceConfigUpdate, DeploymentResourceConfigUpdate$Outbound } from "./deploymentresourceconfigupdate.js";
import { WorkflowsWorkerSpecUpdate, WorkflowsWorkerSpecUpdate$Outbound } from "./workflowsworkerspecupdate.js";
export type UpdateDeploymentRequest = {
    spec?: WorkflowsWorkerSpecUpdate | null | undefined;
    resources?: DeploymentResourceConfigUpdate | null | undefined;
};
/** @internal */
export type UpdateDeploymentRequest$Outbound = {
    spec?: WorkflowsWorkerSpecUpdate$Outbound | null | undefined;
    resources?: DeploymentResourceConfigUpdate$Outbound | null | undefined;
};
/** @internal */
export declare const UpdateDeploymentRequest$outboundSchema: z.ZodType<UpdateDeploymentRequest$Outbound, UpdateDeploymentRequest>;
export declare function updateDeploymentRequestToJSON(updateDeploymentRequest: UpdateDeploymentRequest): string;
//# sourceMappingURL=updatedeploymentrequest.d.ts.map