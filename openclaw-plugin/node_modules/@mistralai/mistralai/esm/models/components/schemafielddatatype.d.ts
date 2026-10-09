import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
export declare const SchemaFieldDataType: {
    readonly Int: "int";
    readonly Bool: "bool";
    readonly String: "string";
    readonly Embedding: "embedding";
    readonly Long: "long";
    readonly Float: "float";
};
export type SchemaFieldDataType = ClosedEnum<typeof SchemaFieldDataType>;
/** @internal */
export declare const SchemaFieldDataType$outboundSchema: z.ZodEnum<typeof SchemaFieldDataType>;
//# sourceMappingURL=schemafielddatatype.d.ts.map