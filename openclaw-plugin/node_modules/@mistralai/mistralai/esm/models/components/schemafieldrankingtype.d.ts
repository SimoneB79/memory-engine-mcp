import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
export declare const SchemaFieldRankingType: {
    readonly Count: "count";
    readonly Embedding: "embedding";
    readonly Timestamp: "timestamp";
    readonly Text: "text";
    readonly String: "string";
    readonly Bool: "bool";
    readonly Int: "int";
    readonly Language: "language";
};
export type SchemaFieldRankingType = ClosedEnum<typeof SchemaFieldRankingType>;
/** @internal */
export declare const SchemaFieldRankingType$outboundSchema: z.ZodEnum<typeof SchemaFieldRankingType>;
//# sourceMappingURL=schemafieldrankingtype.d.ts.map