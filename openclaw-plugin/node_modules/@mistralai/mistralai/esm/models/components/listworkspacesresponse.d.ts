import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { UserWorkspace } from "./userworkspace.js";
export type ListWorkspacesResponse = {
    /**
     * The workspaces the authenticated user is a member of, each tagged with the organization it belongs to.
     */
    workspaces: Array<UserWorkspace>;
};
/** @internal */
export declare const ListWorkspacesResponse$inboundSchema: z.ZodType<ListWorkspacesResponse, unknown>;
export declare function listWorkspacesResponseFromJSON(jsonString: string): SafeParseResult<ListWorkspacesResponse, SDKValidationError>;
//# sourceMappingURL=listworkspacesresponse.d.ts.map