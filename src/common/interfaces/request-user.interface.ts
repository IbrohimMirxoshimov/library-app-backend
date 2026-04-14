/**
 * User data extracted from JWT and loaded from DB.
 * Attached to request object by JwtStrategy.
 */
export interface RequestUser {
  /** User ID from JWT sub claim */
  id: number;
  /** Token type: "user" for regular, "internal" for bot service */
  type: 'user' | 'internal';
  /** User's role name (null = regular reader) */
  roleName: string | null;
  /** User's permission values from role */
  permissions: number[];
  /** Library ID for admin users (library-scoped access) */
  adminLibraryId: number | null;
}
