import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { Library } from "./library.js";
import { PaginationInfo } from "./paginationinfo.js";
export type ListLibrariesResponse = {
    /**
     * Deprecated: offset pagination metadata. Only populated for callers using the deprecated `page` parameter; omitted when `page_token` is used. While RBAC filtering is being rolled out `total_items` is a rough estimate (candidate count before per-library checks). Use `next_page_token` instead — this field will be removed once offset paging is retired.
     *
     * @deprecated field: This will be removed in a future release, please migrate away from it as soon as possible.
     */
    pagination?: PaginationInfo | null | undefined;
    data: Array<Library>;
    /**
     * Opaque continuation token for the next page. Pass it back as `page_token` to fetch the next page. Null when there are no more results. Prefer this over the deprecated offset `page` parameter.
     */
    nextPageToken?: string | null | undefined;
};
/** @internal */
export declare const ListLibrariesResponse$inboundSchema: z.ZodType<ListLibrariesResponse, unknown>;
export declare function listLibrariesResponseFromJSON(jsonString: string): SafeParseResult<ListLibrariesResponse, SDKValidationError>;
//# sourceMappingURL=listlibrariesresponse.d.ts.map