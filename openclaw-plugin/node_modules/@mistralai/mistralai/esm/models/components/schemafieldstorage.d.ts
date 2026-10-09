import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
export declare const SchemaFieldStorage: {
    readonly InMemory: "in_memory";
    readonly OnDisk: "on_disk";
};
export type SchemaFieldStorage = ClosedEnum<typeof SchemaFieldStorage>;
/** @internal */
export declare const SchemaFieldStorage$outboundSchema: z.ZodEnum<typeof SchemaFieldStorage>;
//# sourceMappingURL=schemafieldstorage.d.ts.map