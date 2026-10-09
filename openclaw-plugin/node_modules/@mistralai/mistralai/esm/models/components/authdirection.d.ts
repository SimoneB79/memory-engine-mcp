import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
export declare const AuthDirection: {
    readonly Inbound: "inbound";
    readonly Outbound: "outbound";
};
export type AuthDirection = ClosedEnum<typeof AuthDirection>;
/** @internal */
export declare const AuthDirection$outboundSchema: z.ZodEnum<typeof AuthDirection>;
//# sourceMappingURL=authdirection.d.ts.map