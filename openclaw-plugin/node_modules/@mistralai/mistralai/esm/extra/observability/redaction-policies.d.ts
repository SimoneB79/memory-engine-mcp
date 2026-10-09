/**
 * Redaction policies for client-side redaction of telemetry spans.
 *
 * Can be customized through the CallbackRedactionPolicy, or extended by
 * subclassing RedactionPolicy.
 */
import type { AttributeValue, Attributes } from "@opentelemetry/api";
/**
 * User-supplied per-attribute masker: given (key, value), return the value to
 * keep. Return the value unchanged to keep it, a redacted value to mask it, or
 * `undefined` to drop the attribute entirely.
 */
export type AttributeMaskCallback = (key: string, value: AttributeValue) => AttributeValue | undefined;
export declare const DEFAULT_REDACTED_VALUE = "[REDACTED]";
export declare function defaultRedactionPolicy(): RedactionPolicy;
/** Base class for redaction policies. */
export declare abstract class RedactionPolicy {
    /** Return a new attribute mapping with sensitive data removed. */
    abstract redactAttributes(attributes: Attributes | undefined): Record<string, AttributeValue>;
    /** Return the span name to export. Defaults to unchanged. */
    redactSpanName(name: string): string;
    /** Return the status description to export. Defaults to unchanged. */
    redactStatusDescription(description: string | undefined): string | undefined;
}
export declare const DEFAULT_SENSITIVE_ATTRIBUTE_KEYS: ReadonlySet<string>;
export declare const DEFAULT_SENSITIVE_ATTRIBUTE_FRAGMENTS: ReadonlySet<string>;
export declare const DEFAULT_SAFE_ATTRIBUTE_KEYS: ReadonlySet<string>;
export declare const DEFAULT_TOKEN_PATTERNS: readonly RegExp[];
export declare const DEFAULT_PII_SECRET_PATTERNS: readonly RegExp[];
/**
 * Content-oriented policy based on regexes.
 *
 * This is the default policy. Leaves keys and structure intact, scans string
 * values and redacts matched substrings. Fewer false positives than
 * AttributeRedactionPolicy and aims to preserve observability value; may miss
 * free-form PII or secrets not in the default patterns.
 */
export declare class RegexRedactionPolicy extends RedactionPolicy {
    private readonly patterns;
    private readonly redactedValue;
    constructor(patterns?: readonly RegExp[], options?: {
        redactedValue?: string;
    });
    redactAttributes(attributes: Attributes | undefined): Record<string, AttributeValue>;
    redactSpanName(name: string): string;
    redactStatusDescription(description: string | undefined): string | undefined;
}
/**
 * Key-oriented hybrid policy.
 *
 * An opt-in, high-recall alternative to the default policy: "safe by default",
 * at the cost of erasing most prompt/response content. It redacts whole values
 * for keys judged sensitive (explicit set, fragment match, or non-primitive
 * value), then runs token patterns over the values it keeps to redact values.
 *
 * When `emitRedactionMetadata` is enabled, each redaction emits a companion
 * attribute. For a value removed wholesale: `{key}.redacted_length` for strings,
 * `{key}.redacted_count` for collections, `{key}.redacted_type` otherwise. For
 * matches scrubbed from a value that is otherwise kept: `{key}.redacted_matches`,
 * the number of substitutions made (summed across sequence elements).
 */
export declare class AttributeRedactionPolicy extends RedactionPolicy {
    private readonly sensitiveKeys;
    private readonly safeKeys;
    private readonly sensitiveFragments;
    private readonly tokenPatterns;
    private readonly redactNonPrimitive;
    private readonly redactedValue;
    private readonly emitRedactionMetadata;
    constructor(options?: {
        sensitiveKeys?: ReadonlySet<string>;
        safeKeys?: ReadonlySet<string>;
        sensitiveFragments?: ReadonlySet<string>;
        tokenPatterns?: readonly RegExp[];
        redactNonPrimitive?: boolean;
        redactedValue?: string;
        emitRedactionMetadata?: boolean;
    });
    private shouldRedact;
    private hasSensitiveFragment;
    redactAttributes(attributes: Attributes | undefined): Record<string, AttributeValue>;
    redactStatusDescription(description: string | undefined): string | undefined;
}
/**
 * Callback-based policy for users to provide custom redaction capabilities.
 *
 * The callback is invoked per attribute and should return the value to keep or
 * `undefined` to drop the attribute. Span name and status description are left
 * unchanged (the callback operates on attributes only).
 */
export declare class CallbackRedactionPolicy extends RedactionPolicy {
    private readonly maskFunction;
    constructor(maskFunction: AttributeMaskCallback);
    redactAttributes(attributes: Attributes | undefined): Record<string, AttributeValue>;
}
//# sourceMappingURL=redaction-policies.d.ts.map