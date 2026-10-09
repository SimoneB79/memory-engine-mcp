import * as z from "zod/v4";
import * as components from "../components/index.js";
export type SetServiceAccountRolesV1ServiceAccountsServiceAccountIdRolesPutRequest = {
    serviceAccountId: string;
    setServiceAccountRolesRequest: components.SetServiceAccountRolesRequest;
};
/** @internal */
export type SetServiceAccountRolesV1ServiceAccountsServiceAccountIdRolesPutRequest$Outbound = {
    service_account_id: string;
    SetServiceAccountRolesRequest: components.SetServiceAccountRolesRequest$Outbound;
};
/** @internal */
export declare const SetServiceAccountRolesV1ServiceAccountsServiceAccountIdRolesPutRequest$outboundSchema: z.ZodType<SetServiceAccountRolesV1ServiceAccountsServiceAccountIdRolesPutRequest$Outbound, SetServiceAccountRolesV1ServiceAccountsServiceAccountIdRolesPutRequest>;
export declare function setServiceAccountRolesV1ServiceAccountsServiceAccountIdRolesPutRequestToJSON(setServiceAccountRolesV1ServiceAccountsServiceAccountIdRolesPutRequest: SetServiceAccountRolesV1ServiceAccountsServiceAccountIdRolesPutRequest): string;
//# sourceMappingURL=setserviceaccountrolesv1serviceaccountsserviceaccountidrolesput.d.ts.map