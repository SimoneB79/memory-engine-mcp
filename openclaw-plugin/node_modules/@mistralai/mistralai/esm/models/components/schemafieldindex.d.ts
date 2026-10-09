import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
export declare const SchemaFieldIndex: {
    readonly Ann: "ann";
    readonly Bm25: "bm25";
    readonly Attribute: "attribute";
};
export type SchemaFieldIndex = ClosedEnum<typeof SchemaFieldIndex>;
/** @internal */
export declare const SchemaFieldIndex$outboundSchema: z.ZodEnum<typeof SchemaFieldIndex>;
//# sourceMappingURL=schemafieldindex.d.ts.map