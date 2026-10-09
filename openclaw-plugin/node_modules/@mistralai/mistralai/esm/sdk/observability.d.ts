import { ClientSDK } from "../lib/sdks.js";
import { Datasets } from "./datasets.js";
import { Evaluations } from "./evaluations.js";
import { Judges } from "./judges.js";
import { Logs } from "./logs.js";
import { Spans } from "./spans.js";
import { Traces } from "./traces.js";
export declare class Observability extends ClientSDK {
    private _judges?;
    get judges(): Judges;
    private _datasets?;
    get datasets(): Datasets;
    private _evaluations?;
    get evaluations(): Evaluations;
    private _logs?;
    get logs(): Logs;
    private _traces?;
    get traces(): Traces;
    private _spans?;
    get spans(): Spans;
}
//# sourceMappingURL=observability.d.ts.map