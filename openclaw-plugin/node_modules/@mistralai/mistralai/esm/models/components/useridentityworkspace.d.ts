import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type UserIdentityWorkspace = {
    id: string;
    name: string;
};
/** @internal */
export declare const UserIdentityWorkspace$inboundSchema: z.ZodType<UserIdentityWorkspace, unknown>;
export declare function userIdentityWorkspaceFromJSON(jsonString: string): SafeParseResult<UserIdentityWorkspace, SDKValidationError>;
//# sourceMappingURL=useridentityworkspace.d.ts.map