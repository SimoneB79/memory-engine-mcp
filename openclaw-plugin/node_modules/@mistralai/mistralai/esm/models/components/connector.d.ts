import * as z from "zod/v4";
import * as discriminatedUnionTypes from "../../types/discriminatedUnion.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { HTTPConnector } from "./httpconnector.js";
import { MCPConnector } from "./mcpconnector.js";
export type Connector = HTTPConnector | MCPConnector | discriminatedUnionTypes.Unknown<"protocol">;
/** @internal */
export declare const Connector$inboundSchema: z.ZodType<Connector, unknown>;
export declare function connectorFromJSON(jsonString: string): SafeParseResult<Connector, SDKValidationError>;
//# sourceMappingURL=connector.d.ts.map