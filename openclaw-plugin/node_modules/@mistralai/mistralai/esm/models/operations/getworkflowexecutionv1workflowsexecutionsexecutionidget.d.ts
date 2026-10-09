import * as z from "zod/v4";
export type GetWorkflowExecutionV1WorkflowsExecutionsExecutionIdGetRequest = {
    executionId: string;
    /**
     * Include the execution's search keys (metadata) in the response.
     */
    includeSearchKeys?: boolean | undefined;
};
/** @internal */
export type GetWorkflowExecutionV1WorkflowsExecutionsExecutionIdGetRequest$Outbound = {
    execution_id: string;
    include_search_keys: boolean;
};
/** @internal */
export declare const GetWorkflowExecutionV1WorkflowsExecutionsExecutionIdGetRequest$outboundSchema: z.ZodType<GetWorkflowExecutionV1WorkflowsExecutionsExecutionIdGetRequest$Outbound, GetWorkflowExecutionV1WorkflowsExecutionsExecutionIdGetRequest>;
export declare function getWorkflowExecutionV1WorkflowsExecutionsExecutionIdGetRequestToJSON(getWorkflowExecutionV1WorkflowsExecutionsExecutionIdGetRequest: GetWorkflowExecutionV1WorkflowsExecutionsExecutionIdGetRequest): string;
//# sourceMappingURL=getworkflowexecutionv1workflowsexecutionsexecutionidget.d.ts.map