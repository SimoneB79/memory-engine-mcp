import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const FTClassifierLossFunction: {
    readonly SingleClass: "single_class";
    readonly MultiClass: "multi_class";
};
export type FTClassifierLossFunction = OpenEnum<typeof FTClassifierLossFunction>;
/** @internal */
export declare const FTClassifierLossFunction$inboundSchema: z.ZodType<FTClassifierLossFunction, unknown>;
//# sourceMappingURL=ftclassifierlossfunction.d.ts.map