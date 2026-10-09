import * as z from "zod/v4";
import { SchemaFieldDataType } from "./schemafielddatatype.js";
import { SchemaFieldIndex } from "./schemafieldindex.js";
import { SchemaFieldRankingType } from "./schemafieldrankingtype.js";
import { SchemaFieldStorage } from "./schemafieldstorage.js";
export type RegisterDeploymentRequestVespaField = {
    name: string;
    type: SchemaFieldDataType;
    storage: SchemaFieldStorage;
    ranking: SchemaFieldRankingType;
    indexType: SchemaFieldIndex | null;
    multidimensional: boolean;
};
/** @internal */
export type RegisterDeploymentRequestVespaField$Outbound = {
    name: string;
    type: string;
    storage: string;
    ranking: string;
    index_type: string | null;
    multidimensional: boolean;
};
/** @internal */
export declare const RegisterDeploymentRequestVespaField$outboundSchema: z.ZodType<RegisterDeploymentRequestVespaField$Outbound, RegisterDeploymentRequestVespaField>;
export declare function registerDeploymentRequestVespaFieldToJSON(registerDeploymentRequestVespaField: RegisterDeploymentRequestVespaField): string;
//# sourceMappingURL=registerdeploymentrequestvespafield.d.ts.map