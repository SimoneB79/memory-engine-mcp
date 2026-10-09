import * as z from "zod/v4";
/**
 * Request body for replacing the workspace roles assigned to a service account.
 */
export type SetServiceAccountRolesRequest = {
    roleIds?: Array<string> | undefined;
};
/** @internal */
export type SetServiceAccountRolesRequest$Outbound = {
    role_ids?: Array<string> | undefined;
};
/** @internal */
export declare const SetServiceAccountRolesRequest$outboundSchema: z.ZodType<SetServiceAccountRolesRequest$Outbound, SetServiceAccountRolesRequest>;
export declare function setServiceAccountRolesRequestToJSON(setServiceAccountRolesRequest: SetServiceAccountRolesRequest): string;
//# sourceMappingURL=setserviceaccountrolesrequest.d.ts.map