import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
/**
 * Supported purposes for client sessions.
 */
export declare const ClientSessionPurpose: {
    readonly Realtime: "realtime";
};
/**
 * Supported purposes for client sessions.
 */
export type ClientSessionPurpose = ClosedEnum<typeof ClientSessionPurpose>;
/** @internal */
export declare const ClientSessionPurpose$inboundSchema: z.ZodEnum<typeof ClientSessionPurpose>;
//# sourceMappingURL=clientsessionpurpose.d.ts.map