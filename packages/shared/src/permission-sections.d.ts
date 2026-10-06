export type PermissionTreeNode = {
    key: string;
    label: string;
    codes?: readonly string[];
    children?: readonly PermissionTreeNode[];
};
export declare const PERMISSION_TREE: readonly PermissionTreeNode[];
export type PermissionTreeViewNode = {
    key: string;
    label: string;
    codes: string[];
    allCodes: string[];
    children: PermissionTreeViewNode[];
};
export declare function buildPermissionTree(codes?: readonly string[]): PermissionTreeViewNode[];
export declare function permissionSectionKey(code: string): string;
export declare const PERMISSION_SECTION_ORDER: readonly ["dashboard", "page_management", "live", "team", "partners", "service_monitor", "settings", "network", "roles", "audit"];
export type PermissionSectionKey = (typeof PERMISSION_SECTION_ORDER)[number] | 'other';
export declare const PERMISSION_SECTION_LABELS: Record<PermissionSectionKey, string>;
export declare function groupPermissionCodesBySection(codes?: readonly string[]): Array<{
    key: PermissionSectionKey;
    label: string;
    codes: string[];
}>;
