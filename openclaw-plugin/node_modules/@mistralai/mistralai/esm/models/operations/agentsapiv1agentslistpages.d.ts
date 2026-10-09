import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import * as components from "../components/index.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type AgentsApiV1AgentsListPagesRequest = {
    /**
     * Number of agents per page
     */
    pageSize?: number | undefined;
    deploymentChat?: boolean | null | undefined;
    sources?: Array<components.RequestSource> | null | undefined;
    /**
     * Filter by agent name
     */
    name?: string | null | undefined;
    /**
     * Search agents by name or ID
     */
    search?: string | null | undefined;
    id?: string | null | undefined;
    metadata?: {
        [k: string]: any;
    } | null | undefined;
    /**
     * Opaque cursor from a previous response's next_page_token. When set, results page forward from the cursor.
     */
    pageToken?: string | null | undefined;
};
export type AgentsApiV1AgentsListPagesResponse = {
    result: components.AgentListPage;
};
/** @internal */
export type AgentsApiV1AgentsListPagesRequest$Outbound = {
    page_size: number;
    deployment_chat?: boolean | null | undefined;
    sources?: Array<string> | null | undefined;
    name?: string | null | undefined;
    search?: string | null | undefined;
    id?: string | null | undefined;
    metadata?: {
        [k: string]: any;
    } | null | undefined;
    page_token?: string | null | undefined;
};
/** @internal */
export declare const AgentsApiV1AgentsListPagesRequest$outboundSchema: z.ZodType<AgentsApiV1AgentsListPagesRequest$Outbound, AgentsApiV1AgentsListPagesRequest>;
export declare function agentsApiV1AgentsListPagesRequestToJSON(agentsApiV1AgentsListPagesRequest: AgentsApiV1AgentsListPagesRequest): string;
/** @internal */
export declare const AgentsApiV1AgentsListPagesResponse$inboundSchema: z.ZodType<AgentsApiV1AgentsListPagesResponse, unknown>;
export declare function agentsApiV1AgentsListPagesResponseFromJSON(jsonString: string): SafeParseResult<AgentsApiV1AgentsListPagesResponse, SDKValidationError>;
//# sourceMappingURL=agentsapiv1agentslistpages.d.ts.map