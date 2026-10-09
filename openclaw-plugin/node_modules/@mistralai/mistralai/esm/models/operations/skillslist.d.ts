import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import * as components from "../components/index.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type SkillsListRequest = {
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
export type SkillsListResponse = {
    result: components.ListSkillsResponse;
};
/** @internal */
export type SkillsListRequest$Outbound = {
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
export declare const SkillsListRequest$outboundSchema: z.ZodType<SkillsListRequest$Outbound, SkillsListRequest>;
export declare function skillsListRequestToJSON(skillsListRequest: SkillsListRequest): string;
/** @internal */
export declare const SkillsListResponse$inboundSchema: z.ZodType<SkillsListResponse, unknown>;
export declare function skillsListResponseFromJSON(jsonString: string): SafeParseResult<SkillsListResponse, SDKValidationError>;
//# sourceMappingURL=skillslist.d.ts.map