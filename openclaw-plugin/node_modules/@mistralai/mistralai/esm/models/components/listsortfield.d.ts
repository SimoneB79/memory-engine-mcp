import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
export declare const ListSortField: {
    readonly ListSortFieldUnspecified: "list_sort_field_unspecified";
    readonly ListSortFieldCreatedAt: "list_sort_field_created_at";
    readonly ListSortFieldLastModifiedAt: "list_sort_field_last_modified_at";
    readonly ListSortFieldName: "list_sort_field_name";
    readonly ListSortFieldTitle: "list_sort_field_title";
};
export type ListSortField = ClosedEnum<typeof ListSortField>;
/** @internal */
export declare const ListSortField$outboundSchema: z.ZodEnum<typeof ListSortField>;
//# sourceMappingURL=listsortfield.d.ts.map