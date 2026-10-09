import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
export declare const ListSortDirection: {
    readonly ListSortDirectionUnspecified: "list_sort_direction_unspecified";
    readonly ListSortDirectionAsc: "list_sort_direction_asc";
    readonly ListSortDirectionDesc: "list_sort_direction_desc";
};
export type ListSortDirection = ClosedEnum<typeof ListSortDirection>;
/** @internal */
export declare const ListSortDirection$outboundSchema: z.ZodEnum<typeof ListSortDirection>;
//# sourceMappingURL=listsortdirection.d.ts.map