import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const DatasetRecordSource: {
    readonly Explorer: "EXPLORER";
    readonly UploadedFile: "UPLOADED_FILE";
    readonly DirectInput: "DIRECT_INPUT";
    readonly Playground: "PLAYGROUND";
    readonly TelemetrySpan: "TELEMETRY_SPAN";
};
export type DatasetRecordSource = OpenEnum<typeof DatasetRecordSource>;
/** @internal */
export declare const DatasetRecordSource$inboundSchema: z.ZodType<DatasetRecordSource, unknown>;
//# sourceMappingURL=datasetrecordsource.d.ts.map