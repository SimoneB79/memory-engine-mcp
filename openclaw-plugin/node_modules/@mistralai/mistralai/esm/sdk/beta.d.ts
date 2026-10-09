import { ClientSDK } from "../lib/sdks.js";
import { BetaAgents } from "./betaagents.js";
import { Connectors } from "./connectors.js";
import { Conversations } from "./conversations.js";
import { Libraries } from "./libraries.js";
import { Observability } from "./observability.js";
import { Prompts } from "./prompts.js";
import { Rag } from "./rag.js";
import { ServiceAccounts } from "./serviceaccounts.js";
import { Skills } from "./skills.js";
import { Users } from "./users.js";
export declare class Beta extends ClientSDK {
    private _prompts?;
    get prompts(): Prompts;
    private _skills?;
    get skills(): Skills;
    private _serviceAccounts?;
    get serviceAccounts(): ServiceAccounts;
    private _conversations?;
    get conversations(): Conversations;
    private _agents?;
    get agents(): BetaAgents;
    private _libraries?;
    get libraries(): Libraries;
    private _observability?;
    get observability(): Observability;
    private _connectors?;
    get connectors(): Connectors;
    private _rag?;
    get rag(): Rag;
    private _users?;
    get users(): Users;
}
//# sourceMappingURL=beta.d.ts.map