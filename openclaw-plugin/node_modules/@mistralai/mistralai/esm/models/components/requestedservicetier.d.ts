import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
export declare const RequestedServiceTier: {
    readonly Auto: "auto";
    readonly StandardOnly: "standard_only";
};
export type RequestedServiceTier = ClosedEnum<typeof RequestedServiceTier>;
/** @internal */
export declare const RequestedServiceTier$outboundSchema: z.ZodEnum<typeof RequestedServiceTier>;
//# sourceMappingURL=requestedservicetier.d.ts.map