import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
export declare const Direction: {
    readonly Asc: "asc";
    readonly Desc: "desc";
};
export type Direction = ClosedEnum<typeof Direction>;
export type OrderByClause = {
    field: string;
    direction?: Direction | undefined;
};
/** @internal */
export declare const Direction$outboundSchema: z.ZodEnum<typeof Direction>;
/** @internal */
export type OrderByClause$Outbound = {
    field: string;
    direction: string;
};
/** @internal */
export declare const OrderByClause$outboundSchema: z.ZodType<OrderByClause$Outbound, OrderByClause>;
export declare function orderByClauseToJSON(orderByClause: OrderByClause): string;
//# sourceMappingURL=orderbyclause.d.ts.map