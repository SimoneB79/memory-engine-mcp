import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
/**
 * Caller-declared channel that initiated record creation. This value does not certify that the payload is an unmodified copy of its source.
 */
export declare const CreateDatasetRecordRequestSource: {
    readonly DirectInput: "DIRECT_INPUT";
    readonly TelemetrySpan: "TELEMETRY_SPAN";
};
/**
 * Caller-declared channel that initiated record creation. This value does not certify that the payload is an unmodified copy of its source.
 */
export type CreateDatasetRecordRequestSource = ClosedEnum<typeof CreateDatasetRecordRequestSource>;
export type CreateDatasetRecordRequest = {
    /**
     * Caller-authored input object stored on a dataset record.
     */
    payload: {
        [k: string]: any;
    };
    properties?: {
        [k: string]: any;
    } | undefined;
    /**
     * Caller-declared channel that initiated record creation. This value does not certify that the payload is an unmodified copy of its source.
     */
    source?: CreateDatasetRecordRequestSource | undefined;
};
/** @internal */
export declare const CreateDatasetRecordRequestSource$outboundSchema: z.ZodEnum<typeof CreateDatasetRecordRequestSource>;
/** @internal */
export type CreateDatasetRecordRequest$Outbound = {
    payload: {
        [k: string]: any;
    };
    properties?: {
        [k: string]: any;
    } | undefined;
    source: string;
};
/** @internal */
export declare const CreateDatasetRecordRequest$outboundSchema: z.ZodType<CreateDatasetRecordRequest$Outbound, CreateDatasetRecordRequest>;
export declare function createDatasetRecordRequestToJSON(createDatasetRecordRequest: CreateDatasetRecordRequest): string;
//# sourceMappingURL=createdatasetrecordrequest.d.ts.map