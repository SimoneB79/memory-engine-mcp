import * as z from "zod/v4";
/**
 * Presence wrapper for a set of alias labels on update RPCs. As a message field it carries presence, so callers can distinguish "leave aliases unchanged" (field omitted) from "clear all aliases" (field set, empty ``values``).
 */
export type AliasList = {
    values?: Array<string> | undefined;
};
/** @internal */
export type AliasList$Outbound = {
    values?: Array<string> | undefined;
};
/** @internal */
export declare const AliasList$outboundSchema: z.ZodType<AliasList$Outbound, AliasList>;
export declare function aliasListToJSON(aliasList: AliasList): string;
//# sourceMappingURL=aliaslist.d.ts.map