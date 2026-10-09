import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
/**
 * Relation a subject holds on a shared registry object.
 */
export declare const ShareRelation: {
    readonly ShareRelationUnspecified: "share_relation_unspecified";
    readonly Reader: "reader";
    readonly Writer: "writer";
};
/**
 * Relation a subject holds on a shared registry object.
 */
export type ShareRelation = ClosedEnum<typeof ShareRelation>;
/** @internal */
export declare const ShareRelation$outboundSchema: z.ZodEnum<typeof ShareRelation>;
//# sourceMappingURL=sharerelation.d.ts.map