import * as z from "zod/v4";
export type GetWorkflowExecutionTraceInfoRequest = {
    executionId: string;
};
/** @internal */
export type GetWorkflowExecutionTraceInfoRequest$Outbound = {
    execution_id: string;
};
/** @internal */
export declare const GetWorkflowExecutionTraceInfoRequest$outboundSchema: z.ZodType<GetWorkflowExecutionTraceInfoRequest$Outbound, GetWorkflowExecutionTraceInfoRequest>;
export declare function getWorkflowExecutionTraceInfoRequestToJSON(getWorkflowExecutionTraceInfoRequest: GetWorkflowExecutionTraceInfoRequest): string;
//# sourceMappingURL=getworkflowexecutiontraceinfo.d.ts.map