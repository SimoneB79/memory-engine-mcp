import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const LocationType: {
    readonly Local: "local";
    readonly K8s: "k8s";
    readonly Managed: "managed";
};
export type LocationType = OpenEnum<typeof LocationType>;
/** @internal */
export declare const LocationType$inboundSchema: z.ZodType<LocationType, unknown>;
/** @internal */
export declare const LocationType$outboundSchema: z.ZodType<string, LocationType>;
//# sourceMappingURL=locationtype.d.ts.map