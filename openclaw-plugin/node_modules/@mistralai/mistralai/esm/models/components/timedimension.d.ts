import * as z from "zod/v4";
import { Granularity } from "./granularity.js";
export type TimeDimension = {
    granularity?: Granularity | undefined;
};
/** @internal */
export type TimeDimension$Outbound = {
    granularity?: string | undefined;
};
/** @internal */
export declare const TimeDimension$outboundSchema: z.ZodType<TimeDimension$Outbound, TimeDimension>;
export declare function timeDimensionToJSON(timeDimension: TimeDimension): string;
//# sourceMappingURL=timedimension.d.ts.map