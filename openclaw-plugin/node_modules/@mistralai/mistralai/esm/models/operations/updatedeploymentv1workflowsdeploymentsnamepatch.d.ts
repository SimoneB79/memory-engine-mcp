import * as z from "zod/v4";
import * as components from "../components/index.js";
export type UpdateDeploymentV1WorkflowsDeploymentsNamePatchRequest = {
    name: string;
    updateDeploymentRequest: components.UpdateDeploymentRequest;
};
/** @internal */
export type UpdateDeploymentV1WorkflowsDeploymentsNamePatchRequest$Outbound = {
    name: string;
    UpdateDeploymentRequest: components.UpdateDeploymentRequest$Outbound;
};
/** @internal */
export declare const UpdateDeploymentV1WorkflowsDeploymentsNamePatchRequest$outboundSchema: z.ZodType<UpdateDeploymentV1WorkflowsDeploymentsNamePatchRequest$Outbound, UpdateDeploymentV1WorkflowsDeploymentsNamePatchRequest>;
export declare function updateDeploymentV1WorkflowsDeploymentsNamePatchRequestToJSON(updateDeploymentV1WorkflowsDeploymentsNamePatchRequest: UpdateDeploymentV1WorkflowsDeploymentsNamePatchRequest): string;
//# sourceMappingURL=updatedeploymentv1workflowsdeploymentsnamepatch.d.ts.map