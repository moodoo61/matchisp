'use client';

import { useMemo } from 'react';
import {
  buildPermissionMatrixRows,
  buildPermissionTree,
  matrixActionsForCodes,
  permissionActionLabel,
  type PermissionMatrixRow,
  type PermissionTreeViewNode,
} from '@isp/shared';
import type { RolePermission } from '../types';

type Props = {
  permissions: RolePermission[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

type FlatRow = {
  key: string;
  label: string;
  depth: number;
  /** كل IDs التابعة (للتحديد الجماعي) */
  groupIds: string[];
  /** صف إجراءات مباشر إن وُجد */
  matrixRow: PermissionMatrixRow | null;
};

function selectionState(ids: string[], selected: Set<string>) {
  const count = ids.filter((id) => selected.has(id)).length;
  return {
    count,
    allOn: count === ids.length && ids.length > 0,
    partial: count > 0 && count < ids.length,
  };
}

function flattenTree(
  nodes: PermissionTreeViewNode[],
  depth: number,
  byCode: Map<string, RolePermission>,
): FlatRow[] {
  const rows: FlatRow[] = [];

  for (const node of nodes) {
    const groupIds = node.allCodes
      .map((code) => byCode.get(code)?.id)
      .filter((id): id is string => Boolean(id));

    const matrixRows = buildPermissionMatrixRows(node.codes);
    const hasChildren = node.children.length > 0;

    if (!hasChildren && matrixRows.length > 1) {
      // قسم بلا أبناء وعدة موارد: صف عنوان ثم صفوف الموارد
      rows.push({
        key: `${node.key}__head`,
        label: node.label,
        depth,
        groupIds,
        matrixRow: null,
      });
      for (const matrixRow of matrixRows) {
        const ids = Object.values(matrixRow.actions)
          .map((code) => byCode.get(code)?.id)
          .filter((id): id is string => Boolean(id));
        rows.push({
          key: `${node.key}__${matrixRow.resource}`,
          label: matrixRow.label,
          depth: depth + 1,
          groupIds: ids,
          matrixRow,
        });
      }
    } else if (!hasChildren) {
      // ورقة بمورد واحد أو بدون: صف واحد فقط
      rows.push({
        key: node.key,
        label: node.label,
        depth,
        groupIds,
        matrixRow: matrixRows[0] ?? null,
      });
    } else {
      // قسم بأبناء: صف القسم (مع اختصاراته إن وُجدت) ثم الأبناء
      rows.push({
        key: node.key,
        label: node.label,
        depth,
        groupIds,
        matrixRow: matrixRows.length === 1 ? matrixRows[0] : null,
      });
      if (matrixRows.length > 1) {
        for (const matrixRow of matrixRows) {
          const ids = Object.values(matrixRow.actions)
            .map((code) => byCode.get(code)?.id)
            .filter((id): id is string => Boolean(id));
          rows.push({
            key: `${node.key}__${matrixRow.resource}`,
            label: matrixRow.label,
            depth: depth + 1,
            groupIds: ids,
            matrixRow,
          });
        }
      }
      rows.push(...flattenTree(node.children, depth + 1, byCode));
    }
  }

  return rows;
}

export function PermissionPicker({
  permissions,
  selectedIds,
  onChange,
}: Props) {
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const byCode = useMemo(
    () => new Map(permissions.map((p) => [p.code, p])),
    [permissions],
  );
  const tree = useMemo(
    () => buildPermissionTree(permissions.map((p) => p.code)),
    [permissions],
  );
  const actions = useMemo(
    () => matrixActionsForCodes(permissions.map((p) => p.code)),
    [permissions],
  );
  const flatRows = useMemo(
    () => flattenTree(tree, 0, byCode),
    [tree, byCode],
  );

  function toggleIds(ids: string[], checked: boolean) {
    const next = new Set(selected);
    for (const id of ids) {
      if (checked) next.add(id);
      else next.delete(id);
    }
    onChange([...next]);
  }

  if (!permissions.length) {
    return <p className="muted">لا توجد صلاحيات محمّلة</p>;
  }

  return (
    <div className="roles-perm-picker">
      <div
        className="roles-perm-grid roles-perm-grid-head"
        style={{
          gridTemplateColumns: `minmax(11rem, 1.4fr) repeat(${actions.length}, 3.2rem)`,
        }}
      >
        <div className="roles-perm-col-label">القسم / المورد</div>
        {actions.map((action) => (
          <div key={action} className="roles-perm-col-action">
            {permissionActionLabel(action)}
          </div>
        ))}
      </div>

      <div className="roles-perm-rows">
        {flatRows.map((row) => {
          const state = selectionState(row.groupIds, selected);
          const isGroupOnly = !row.matrixRow;

          return (
            <div
              key={row.key}
              className={[
                'roles-perm-grid',
                'roles-perm-row',
                row.depth === 0 ? 'is-root' : '',
                isGroupOnly ? 'is-group' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                gridTemplateColumns: `minmax(11rem, 1.4fr) repeat(${actions.length}, 3.2rem)`,
                ['--roles-indent' as string]: `${row.depth * 1.1}rem`,
              }}
            >
              <label className="roles-perm-name-cell">
                <input
                  type="checkbox"
                  checked={state.allOn}
                  ref={(el) => {
                    if (el) el.indeterminate = state.partial;
                  }}
                  onChange={(e) => toggleIds(row.groupIds, e.target.checked)}
                />
                <span>{row.label}</span>
              </label>

              {actions.map((action) => {
                if (!row.matrixRow) {
                  return <div key={action} className="roles-perm-col-action" />;
                }
                const code = row.matrixRow.actions[action];
                if (!code) {
                  return (
                    <div
                      key={action}
                      className="roles-perm-col-action is-empty"
                    >
                      <span className="roles-perm-na">—</span>
                    </div>
                  );
                }
                const perm = byCode.get(code);
                if (!perm) {
                  return (
                    <div
                      key={action}
                      className="roles-perm-col-action is-empty"
                    >
                      <span className="roles-perm-na">—</span>
                    </div>
                  );
                }
                return (
                  <label key={action} className="roles-perm-col-action">
                    <input
                      type="checkbox"
                      checked={selected.has(perm.id)}
                      onChange={(e) => toggleIds([perm.id], e.target.checked)}
                      aria-label={`${row.label} — ${permissionActionLabel(action)}`}
                    />
                  </label>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
