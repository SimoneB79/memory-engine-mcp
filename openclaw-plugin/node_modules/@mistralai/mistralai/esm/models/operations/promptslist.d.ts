import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import * as components from "../components/index.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type PromptsListRequest = {
    pageSize?: number | undefined;
    pageToken?: string | undefined;
    alias?: string | undefined;
    fields?: Array<string> | undefined;
    /**
     * Defaults to created_at when omitted.
     */
    sortField?: components.ListSortField | undefined;
    /**
     * Defaults to descending for timestamp fields and ascending for text fields.
     */
    sortDirectionQueryParameter?: components.ListSortDirection | undefined;
    /**
     * REST-friendly alias for sort.field. Supported values: created_at, last_modified_at, name, title.
     */
    sortBy?: string | undefined;
    /**
     * REST-friendly alias for sort.direction. Supported values: asc, desc.
     */
    sortDirectionQueryParameter1?: string | undefined;
};
export type PromptsListResponse = {
    result: components.ListPromptsResponse;
};
/** @internal */
export type PromptsListRequest$Outbound = {
    pageSize?: number | undefined;
    pageToken?: string | undefined;
    alias?: string | undefined;
    fields?: Array<string> | undefined;
    "sort.field"?: string | undefined;
    "sort.directionQueryParameter"?: string | undefined;
    sort_by?: string | undefined;
    sort_directionQueryParameter1?: string | undefined;
};
/** @internal */
export declare const PromptsListRequest$outboundSchema: z.ZodType<PromptsListRequest$Outbound, PromptsListRequest>;
export declare function promptsListRequestToJSON(promptsListRequest: PromptsListRequest): string;
/** @internal */
export declare const PromptsListResponse$inboundSchema: z.ZodType<PromptsListResponse, unknown>;
export declare function promptsListResponseFromJSON(jsonString: string): SafeParseResult<PromptsListResponse, SDKValidationError>;
//# sourceMappingURL=promptslist.d.ts.map