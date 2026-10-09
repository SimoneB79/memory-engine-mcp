import * as z from "zod/v4";
export type LibrariesListV1Request = {
    pageSize?: number | undefined;
    /**
     * Continuation token from a previous response's next_page_token. Preferred over `page`.
     */
    pageToken?: string | null | undefined;
    /**
     * Deprecated: use page_token. Offset paging re-scans earlier pages and is being phased out.
     *
     * @deprecated field: This will be removed in a future release, please migrate away from it as soon as possible.
     */
    page?: number | undefined;
    /**
     * Case-insensitive search on the library name.
     */
    search?: string | null | undefined;
    /**
     * Deprecated: this parameter will be removed in a future version.
     *
     * @deprecated field: This will be removed in a future release, please migrate away from it as soon as possible.
     */
    filterOwnedByMe?: boolean | null | undefined;
};
/** @internal */
export type LibrariesListV1Request$Outbound = {
    page_size: number;
    page_token?: string | null | undefined;
    page: number;
    search?: string | null | undefined;
    filter_owned_by_me?: boolean | null | undefined;
};
/** @internal */
export declare const LibrariesListV1Request$outboundSchema: z.ZodType<LibrariesListV1Request$Outbound, LibrariesListV1Request>;
export declare function librariesListV1RequestToJSON(librariesListV1Request: LibrariesListV1Request): string;
//# sourceMappingURL=librarieslistv1.d.ts.map