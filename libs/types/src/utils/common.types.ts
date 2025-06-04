/**
 * @fileoverview Common utility types used throughout the application
 * @module @agent-desktop/types/utils/common
 */

/**
 * Make all properties in T optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make all properties in T required recursively
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * Make all properties in T readonly recursively
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Extract keys of T where the value extends U
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Pick properties from T where the value extends U
 */
export type PickByType<T, U> = Pick<T, KeysOfType<T, U>>;

/**
 * Omit properties from T where the value extends U
 */
export type OmitByType<T, U> = Omit<T, KeysOfType<T, U>>;

/**
 * Make specific properties K in T optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties K in T required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Create a union of all possible dot-notation paths in T
 */
export type DotNotationPath<T, K extends keyof T = keyof T> = K extends string
  ? T[K] extends Record<string, unknown>
    ? `${K}` | `${K}.${DotNotationPath<T[K]>}`
    : `${K}`
  : never;

/**
 * Get the value type from a dot-notation path
 */
export type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? T[K] extends Record<string, unknown>
      ? PathValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
  ? T[P]
  : never;

/**
 * Represents a value that may be null or undefined
 */
export type Nullable<T> = T | null | undefined;

/**
 * Represents a value that may be null
 */
export type Maybe<T> = T | null;

/**
 * Represents a value that may be undefined
 */
export type Optional<T> = T | undefined;

/**
 * Generic result type for operations that may fail
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 * Success result
 */
export interface Success<T> {
  readonly success: true;
  readonly data: T;
  readonly error?: never;
}

/**
 * Failure result
 */
export interface Failure<E> {
  readonly success: false;
  readonly data?: never;
  readonly error: E;
}

/**
 * Async result type
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/**
 * Function that may throw or return a result
 */
export type Fallible<T, E = Error> = () => Result<T, E>;

/**
 * Async function that may throw or return a result
 */
export type AsyncFallible<T, E = Error> = () => AsyncResult<T, E>;

/**
 * Branded type for creating nominal types
 */
export type Brand<T, TBrand> = T & { readonly __brand: TBrand };

/**
 * ID types for different entities
 */
export type CustomerID = Brand<string, 'CustomerID'>;
export type UserID = Brand<string, 'UserID'>;
export type SessionID = Brand<string, 'SessionID'>;
export type ModuleID = Brand<string, 'ModuleID'>;
export type ContactID = Brand<string, 'ContactID'>;
export type AgentID = Brand<string, 'AgentID'>;
export type QueueID = Brand<string, 'QueueID'>;

/**
 * Timestamp type for consistent date handling
 */
export type Timestamp = Brand<number, 'Timestamp'>;

/**
 * ISO date string type
 */
export type ISODateString = Brand<string, 'ISODateString'>;

/**
 * UUID type
 */
export type UUID = Brand<string, 'UUID'>;

/**
 * Email address type
 */
export type Email = Brand<string, 'Email'>;

/**
 * Phone number type
 */
export type PhoneNumber = Brand<string, 'PhoneNumber'>;

/**
 * URL type
 */
export type URL = Brand<string, 'URL'>;

/**
 * JSON string type
 */
export type JSONString = Brand<string, 'JSONString'>;

/**
 * Base64 encoded string type
 */
export type Base64String = Brand<string, 'Base64String'>;

/**
 * Pagination parameters
 */
export interface PaginationParams {
  readonly page: number;
  readonly limit: number;
  readonly offset?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort parameters
 */
export interface SortParams<T = string> {
  readonly field: T;
  readonly direction: SortDirection;
}

/**
 * Filter operator types
 */
export type FilterOperator = 
  | 'eq' 
  | 'ne' 
  | 'gt' 
  | 'gte' 
  | 'lt' 
  | 'lte' 
  | 'in' 
  | 'nin' 
  | 'contains' 
  | 'startsWith' 
  | 'endsWith'
  | 'regex';

/**
 * Filter condition
 */
export interface FilterCondition<T = unknown> {
  readonly field: string;
  readonly operator: FilterOperator;
  readonly value: T;
}

/**
 * Search parameters
 */
export interface SearchParams {
  readonly query?: string;
  readonly filters?: readonly FilterCondition[];
  readonly sort?: readonly SortParams[];
  readonly pagination?: PaginationParams;
}

/**
 * Time range
 */
export interface TimeRange {
  readonly start: Date;
  readonly end: Date;
}

/**
 * Coordinates for geographical data
 */
export interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
}

/**
 * Address information
 */
export interface Address {
  readonly street1: string;
  readonly street2?: string;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string;
  readonly country: string;
  readonly coordinates?: Coordinates;
}

/**
 * Contact information
 */
export interface ContactInfo {
  readonly email?: Email;
  readonly phone?: PhoneNumber;
  readonly mobile?: PhoneNumber;
  readonly fax?: PhoneNumber;
  readonly address?: Address;
}

/**
 * Generic metadata object
 */
export type Metadata = Record<string, unknown>;

/**
 * Type guard to check if value is not null or undefined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard to check if value is null or undefined
 */
export function isNullOrUndefined<T>(value: T | null | undefined): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Type guard for Success result
 */
export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.success === true;
}

/**
 * Type guard for Failure result
 */
export function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
  return result.success === false;
}

/**
 * Create a Success result
 */
export function success<T>(data: T): Success<T> {
  return { success: true, data };
}

/**
 * Create a Failure result
 */
export function failure<E>(error: E): Failure<E> {
  return { success: false, error };
}

/**
 * Assert that a value is never reached (for exhaustive checking)
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}