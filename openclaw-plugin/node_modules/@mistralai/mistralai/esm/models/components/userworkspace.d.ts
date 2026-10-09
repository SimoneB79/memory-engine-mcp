import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type UserWorkspace = {
    /**
     * The workspace's unique identifier.
     */
    id: string;
    /**
     * The workspace's display name.
     */
    name: string;
    /**
     * The identifier of the organization this workspace belongs to.
     */
    organizationId: string;
};
/** @internal */
export declare const UserWorkspace$inboundSchema: z.ZodType<UserWorkspace, unknown>;
export declare function userWorkspaceFromJSON(jsonString: string): SafeParseResult<UserWorkspace, SDKValidationError>;
//# sourceMappingURL=userworkspace.d.ts.map