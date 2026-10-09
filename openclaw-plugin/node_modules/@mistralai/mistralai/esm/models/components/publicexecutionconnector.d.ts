import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { PublicExecutionConnectionConfig } from "./publicexecutionconnectionconfig.js";
export type PublicExecutionConnector = {
    id: string;
    name: string;
    connectionConfig: PublicExecutionConnectionConfig | null;
};
/** @internal */
export declare const PublicExecutionConnector$inboundSchema: z.ZodType<PublicExecutionConnector, unknown>;
export declare function publicExecutionConnectorFromJSON(jsonString: string): SafeParseResult<PublicExecutionConnector, SDKValidationError>;
//# sourceMappingURL=publicexecutionconnector.d.ts.map