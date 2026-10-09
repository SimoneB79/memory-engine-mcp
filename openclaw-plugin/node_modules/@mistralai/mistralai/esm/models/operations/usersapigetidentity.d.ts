import * as z from "zod/v4";
export type UsersApiGetIdentitySecurity = {
    dashboardUserContextAuth: string;
};
/** @internal */
export type UsersApiGetIdentitySecurity$Outbound = {
    DashboardUserContextAuth: string;
};
/** @internal */
export declare const UsersApiGetIdentitySecurity$outboundSchema: z.ZodType<UsersApiGetIdentitySecurity$Outbound, UsersApiGetIdentitySecurity>;
export declare function usersApiGetIdentitySecurityToJSON(usersApiGetIdentitySecurity: UsersApiGetIdentitySecurity): string;
//# sourceMappingURL=usersapigetidentity.d.ts.map