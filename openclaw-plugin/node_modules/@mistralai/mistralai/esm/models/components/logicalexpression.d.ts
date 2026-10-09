import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ToolProperties } from "./toolproperties.js";
export declare const LogicalExpressionType: {
    readonly And: "and";
    readonly Or: "or";
};
export type LogicalExpressionType = OpenEnum<typeof LogicalExpressionType>;
export type LogicalExpression = {
    type: LogicalExpressionType;
    expressions: Array<LogicalExpression | ToolProperties | Array<string>>;
};
export type Expression = LogicalExpression | ToolProperties | Array<string>;
/** @internal */
export declare const LogicalExpressionType$inboundSchema: z.ZodType<LogicalExpressionType, unknown>;
/** @internal */
export declare const LogicalExpression$inboundSchema: z.ZodType<LogicalExpression, unknown>;
export declare function logicalExpressionFromJSON(jsonString: string): SafeParseResult<LogicalExpression, SDKValidationError>;
/** @internal */
export declare const Expression$inboundSchema: z.ZodType<Expression, unknown>;
export declare function expressionFromJSON(jsonString: string): SafeParseResult<Expression, SDKValidationError>;
//# sourceMappingURL=logicalexpression.d.ts.map