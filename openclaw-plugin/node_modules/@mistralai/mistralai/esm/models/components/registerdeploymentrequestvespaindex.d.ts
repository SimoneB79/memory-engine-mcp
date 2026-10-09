import * as z from "zod/v4";
import { RegisterDeploymentRequestVespaField, RegisterDeploymentRequestVespaField$Outbound } from "./registerdeploymentrequestvespafield.js";
export type RegisterDeploymentRequestVespaIndex = {
    name: string;
    fields: Array<RegisterDeploymentRequestVespaField>;
    sd: string;
    embeddingDimensions?: number | null | undefined;
};
/** @internal */
export type RegisterDeploymentRequestVespaIndex$Outbound = {
    name: string;
    fields: Array<RegisterDeploymentRequestVespaField$Outbound>;
    sd: string;
    embedding_dimensions?: number | null | undefined;
};
/** @internal */
export declare const RegisterDeploymentRequestVespaIndex$outboundSchema: z.ZodType<RegisterDeploymentRequestVespaIndex$Outbound, RegisterDeploymentRequestVespaIndex>;
export declare function registerDeploymentRequestVespaIndexToJSON(registerDeploymentRequestVespaIndex: RegisterDeploymentRequestVespaIndex): string;
//# sourceMappingURL=registerdeploymentrequestvespaindex.d.ts.map