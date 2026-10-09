/**
 * OTEL conventions for gen AI may be found at:
 *
 * https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/
 * https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-agent-spans/
 */
import { type Context, type Span, type Tracer, type TracerProvider } from "@opentelemetry/api";
export type { Context, Span, Tracer };
export { getRegisteredTracerProvider, registerTracerProvider } from "./provider.js";
export declare const semConvAttributes: {
    readonly ATTR_ERROR_TYPE: "error.type";
    readonly ATTR_GEN_AI_AGENT_DESCRIPTION: "gen_ai.agent.description";
    readonly ATTR_GEN_AI_AGENT_ID: "gen_ai.agent.id";
    readonly ATTR_GEN_AI_AGENT_NAME: "gen_ai.agent.name";
    readonly ATTR_GEN_AI_CONVERSATION_ID: "gen_ai.conversation.id";
    readonly ATTR_GEN_AI_INPUT_MESSAGES: "gen_ai.input.messages";
    readonly ATTR_GEN_AI_OPERATION_NAME: "gen_ai.operation.name";
    readonly ATTR_GEN_AI_OUTPUT_MESSAGES: "gen_ai.output.messages";
    readonly ATTR_GEN_AI_PROVIDER_NAME: "gen_ai.provider.name";
    readonly ATTR_GEN_AI_REQUEST_CHOICE_COUNT: "gen_ai.request.choice.count";
    readonly ATTR_GEN_AI_REQUEST_ENCODING_FORMATS: "gen_ai.request.encoding_formats";
    readonly ATTR_GEN_AI_REQUEST_FREQUENCY_PENALTY: "gen_ai.request.frequency_penalty";
    readonly ATTR_GEN_AI_REQUEST_MAX_TOKENS: "gen_ai.request.max_tokens";
    readonly ATTR_GEN_AI_REQUEST_MODEL: "gen_ai.request.model";
    readonly ATTR_GEN_AI_REQUEST_PRESENCE_PENALTY: "gen_ai.request.presence_penalty";
    readonly ATTR_GEN_AI_REQUEST_SEED: "gen_ai.request.seed";
    readonly ATTR_GEN_AI_REQUEST_STOP_SEQUENCES: "gen_ai.request.stop_sequences";
    readonly ATTR_GEN_AI_REQUEST_TEMPERATURE: "gen_ai.request.temperature";
    readonly ATTR_GEN_AI_REQUEST_TOP_K: "gen_ai.request.top_k";
    readonly ATTR_GEN_AI_REQUEST_TOP_P: "gen_ai.request.top_p";
    readonly ATTR_GEN_AI_RESPONSE_FINISH_REASONS: "gen_ai.response.finish_reasons";
    readonly ATTR_GEN_AI_RESPONSE_ID: "gen_ai.response.id";
    readonly ATTR_GEN_AI_RESPONSE_MODEL: "gen_ai.response.model";
    readonly ATTR_GEN_AI_SYSTEM_INSTRUCTIONS: "gen_ai.system_instructions";
    readonly ATTR_GEN_AI_TOOL_CALL_ARGUMENTS: "gen_ai.tool.call.arguments";
    readonly ATTR_GEN_AI_TOOL_CALL_ID: "gen_ai.tool.call.id";
    readonly ATTR_GEN_AI_TOOL_CALL_RESULT: "gen_ai.tool.call.result";
    readonly ATTR_GEN_AI_TOOL_DEFINITIONS: "gen_ai.tool.definitions";
    readonly ATTR_GEN_AI_TOOL_NAME: "gen_ai.tool.name";
    readonly ATTR_GEN_AI_TOOL_TYPE: "gen_ai.tool.type";
    readonly ATTR_GEN_AI_USAGE_INPUT_TOKENS: "gen_ai.usage.input_tokens";
    readonly ATTR_GEN_AI_USAGE_OUTPUT_TOKENS: "gen_ai.usage.output_tokens";
    readonly ATTR_HTTP_REQUEST_METHOD: "http.request.method";
    readonly ATTR_HTTP_RESPONSE_STATUS_CODE: "http.response.status_code";
    readonly ATTR_SERVER_ADDRESS: "server.address";
    readonly ATTR_SERVER_PORT: "server.port";
    readonly ATTR_URL_FULL: "url.full";
    readonly GEN_AI_OPERATION_NAME_VALUE_CHAT: "chat";
    readonly GEN_AI_OPERATION_NAME_VALUE_CREATE_AGENT: "create_agent";
    readonly GEN_AI_OPERATION_NAME_VALUE_EMBEDDINGS: "embeddings";
    readonly GEN_AI_OPERATION_NAME_VALUE_EXECUTE_TOOL: "execute_tool";
    readonly GEN_AI_OPERATION_NAME_VALUE_GENERATE_CONTENT: "generate_content";
    readonly GEN_AI_OPERATION_NAME_VALUE_INVOKE_AGENT: "invoke_agent";
    readonly GEN_AI_OPERATION_NAME_VALUE_TEXT_COMPLETION: "text_completion";
    readonly GEN_AI_PROVIDER_NAME_VALUE_MISTRAL_AI: "mistral_ai";
};
export declare const OTEL_SERVICE_NAME = "mistralai_sdk";
export declare const MISTRAL_SDK_OTEL_TRACER_NAME = "mistralai_sdk_tracer";
export declare const MistralAIAttributes: {
    readonly MISTRAL_AI_OCR_USAGE_PAGES_PROCESSED: "mistral_ai.ocr.usage.pages_processed";
    readonly MISTRAL_AI_OCR_USAGE_DOC_SIZE_BYTES: "mistral_ai.ocr.usage.doc_size_bytes";
    readonly MISTRAL_AI_ERROR_CODE: "mistral_ai.error.code";
};
export declare const TracingErrors: {
    readonly FAILED_TO_CREATE_SPAN_FOR_REQUEST: "Failed to create span for request.";
    readonly FAILED_TO_ENRICH_SPAN_WITH_RESPONSE: "Failed to enrich span with response.";
    readonly FAILED_TO_HANDLE_ERROR_IN_SPAN: "Failed to handle error in span.";
    readonly FAILED_TO_END_SPAN: "Failed to end span.";
};
export declare function enrichSpanFromRequest(span: Span, operationId: string, url: URL, method: string, host: string, body: string | null): Span;
export declare function enrichSpanFromResponse(tracer: Tracer, span: Span, operationId: string, responseData: Record<string, unknown>): void;
/**
 * Get a tracer from the registered or global TracerProvider.
 *
 * The SDK does not set up its own TracerProvider. It relies on the application
 * to register one explicitly or configure OpenTelemetry's global provider.
 *
 * If no TracerProvider is configured, the ProxyTracerProvider (default) will
 * return a NoOp tracer, effectively disabling tracing. Once the application
 * sets up a real TracerProvider, subsequent spans will be recorded.
 */
export declare function getOrCreateOtelTracer(provider?: TracerProvider, options?: {
    useRegisteredProvider?: boolean;
}): Tracer;
export declare function getSpanContext(span: Span): Context;
export declare function runWithContext<T>(context: Context, fn: () => T): T;
export declare function recordRequestError(context: Context, error: unknown): Promise<void>;
export declare function getTracedRequestAndSpan(tracer: Tracer, operationId: string, request: Request): Promise<{
    request: Request;
    span: Span;
    body: string | null;
}>;
export declare function getTracedResponse(tracer: Tracer, span: Span, operationId: string, response: Response): Promise<Response>;
export declare function getResponseAndError(span: Span, response: Response | null, error: unknown): Promise<{
    response: Response | null;
    error: unknown;
}>;
/**
 * Create a traced span using a callback pattern.
 * This is the TypeScript equivalent of Python's context manager.
 */
export declare function traceAsync<T>(name: string, fn: (span: Span) => Promise<T>): Promise<T>;
//# sourceMappingURL=otel.d.ts.map