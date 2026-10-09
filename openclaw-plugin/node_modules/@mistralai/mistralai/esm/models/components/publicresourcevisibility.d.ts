import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
/**
 * Connector visibility options.
 */
export declare const PublicResourceVisibility: {
    readonly SharedOrg: "shared_org";
    readonly SharedWorkspace: "shared_workspace";
    readonly Private: "private";
};
/**
 * Connector visibility options.
 */
export type PublicResourceVisibility = ClosedEnum<typeof PublicResourceVisibility>;
/** @internal */
export declare const PublicResourceVisibility$outboundSchema: z.ZodEnum<typeof PublicResourceVisibility>;
//# sourceMappingURL=publicresourcevisibility.d.ts.map