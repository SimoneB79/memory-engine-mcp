import * as z from "zod/v4";
export type UpdateDatasetRecordPayloadRequest = {
    /**
     * Caller-authored input object stored on a dataset record.
     */
    payload: {
        [k: string]: any;
    };
};
/** @internal */
export type UpdateDatasetRecordPayloadRequest$Outbound = {
    payload: {
        [k: string]: any;
    };
};
/** @internal */
export declare const UpdateDatasetRecordPayloadRequest$outboundSchema: z.ZodType<UpdateDatasetRecordPayloadRequest$Outbound, UpdateDatasetRecordPayloadRequest>;
export declare function updateDatasetRecordPayloadRequestToJSON(updateDatasetRecordPayloadRequest: UpdateDatasetRecordPayloadRequest): string;
//# sourceMappingURL=updatedatasetrecordpayloadrequest.d.ts.map