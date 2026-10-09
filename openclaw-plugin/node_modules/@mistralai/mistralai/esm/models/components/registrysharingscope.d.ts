import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const RegistrySharingScope: {
    readonly SharingScopeUnspecified: "sharing_scope_unspecified";
    readonly Private: "private";
    readonly Workspace: "workspace";
};
export type RegistrySharingScope = OpenEnum<typeof RegistrySharingScope>;
/** @internal */
export declare const RegistrySharingScope$inboundSchema: z.ZodType<RegistrySharingScope, unknown>;
/** @internal */
export declare const RegistrySharingScope$outboundSchema: z.ZodType<string, RegistrySharingScope>;
//# sourceMappingURL=registrysharingscope.d.ts.map