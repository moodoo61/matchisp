export declare const PERMISSION_ACTION_ORDER: readonly ["read", "create", "update", "delete", "manage", "toggle", "control", "mount", "unmount", "backup", "restore", "apply", "reboot", "shutdown"];
export type PermissionAction = (typeof PERMISSION_ACTION_ORDER)[number];
export declare const PERMISSION_ACTION_LABELS: Record<PermissionAction, string>;
export declare const PERMISSION_RESOURCE_LABELS: Record<string, string>;
export declare function splitPermissionCode(code: string): {
    resource: string;
    action: string;
};
export declare function permissionResourceLabel(resource: string): string;
export declare function permissionActionLabel(action: string): string;
export type PermissionMatrixRow = {
    resource: string;
    label: string;
    actions: Record<string, string>;
};
export declare function buildPermissionMatrixRows(codes: readonly string[]): PermissionMatrixRow[];
export declare function matrixActionsForCodes(codes: readonly string[]): string[];
