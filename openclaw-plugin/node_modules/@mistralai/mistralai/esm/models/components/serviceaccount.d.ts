import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ServiceAccount = {
    id: string;
    name: string;
    customerId: string;
    organizationId: string;
    workspaceId: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
};
/** @internal */
export declare const ServiceAccount$inboundSchema: z.ZodType<ServiceAccount, unknown>;
export declare function serviceAccountFromJSON(jsonString: string): SafeParseResult<ServiceAccount, SDKValidationError>;
//# sourceMappingURL=serviceaccount.d.ts.map