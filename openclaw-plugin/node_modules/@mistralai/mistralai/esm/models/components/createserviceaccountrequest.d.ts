import * as z from "zod/v4";
export type CreateServiceAccountRequest = {
    name: string;
    workspaceId: string;
    description?: string | null | undefined;
};
/** @internal */
export type CreateServiceAccountRequest$Outbound = {
    name: string;
    workspace_id: string;
    description?: string | null | undefined;
};
/** @internal */
export declare const CreateServiceAccountRequest$outboundSchema: z.ZodType<CreateServiceAccountRequest$Outbound, CreateServiceAccountRequest>;
export declare function createServiceAccountRequestToJSON(createServiceAccountRequest: CreateServiceAccountRequest): string;
//# sourceMappingURL=createserviceaccountrequest.d.ts.map