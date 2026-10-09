import { ClientSDK, RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import * as operations from "../models/operations/index.js";
export declare class Sessions extends ClientSDK {
    /**
     * Create Client Session
     *
     * @remarks
     * Create a client session. Requires the `create_client_session` permission.
     */
    create(request: operations.Body, options?: RequestOptions): Promise<components.CreateRealtimeSessionResponse>;
}
//# sourceMappingURL=sessions.d.ts.map