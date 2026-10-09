import * as z from "zod/v4";
export type GetDeploymentV1WorkflowsDeploymentsNameGetRequest = {
    name: string;
    /**
     * Scope serving status to this workflow
     */
    workflowName?: string | null | undefined;
};
/** @internal */
export type GetDeploymentV1WorkflowsDeploymentsNameGetRequest$Outbound = {
    name: string;
    workflow_name?: string | null | undefined;
};
/** @internal */
export declare const GetDeploymentV1WorkflowsDeploymentsNameGetRequest$outboundSchema: z.ZodType<GetDeploymentV1WorkflowsDeploymentsNameGetRequest$Outbound, GetDeploymentV1WorkflowsDeploymentsNameGetRequest>;
export declare function getDeploymentV1WorkflowsDeploymentsNameGetRequestToJSON(getDeploymentV1WorkflowsDeploymentsNameGetRequest: GetDeploymentV1WorkflowsDeploymentsNameGetRequest): string;
//# sourceMappingURL=getdeploymentv1workflowsdeploymentsnameget.d.ts.map