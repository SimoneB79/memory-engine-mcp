import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
export declare const Granularity: {
    readonly Auto: "auto";
    readonly Second: "second";
    readonly Minute: "minute";
    readonly Hour: "hour";
    readonly Day: "day";
    readonly Week: "week";
    readonly Month: "month";
};
export type Granularity = ClosedEnum<typeof Granularity>;
/** @internal */
export declare const Granularity$outboundSchema: z.ZodEnum<typeof Granularity>;
//# sourceMappingURL=granularity.d.ts.map