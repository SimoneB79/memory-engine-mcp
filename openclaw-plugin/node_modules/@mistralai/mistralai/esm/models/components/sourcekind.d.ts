import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const SourceKind: {
    readonly Span: "span";
    readonly Log: "log";
    readonly Metric: "metric";
};
export type SourceKind = OpenEnum<typeof SourceKind>;
/** @internal */
export declare const SourceKind$inboundSchema: z.ZodType<SourceKind, unknown>;
/** @internal */
export declare const SourceKind$outboundSchema: z.ZodType<string, SourceKind>;
//# sourceMappingURL=sourcekind.d.ts.map