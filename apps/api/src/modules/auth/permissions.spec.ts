import { describe, expect, it } from 'vitest';
import {
  PERMISSIONS,
  ALL_PERMISSIONS,
  hasPermission,
} from '@isp/shared';

describe('permissions foundation', () => {
  it('includes dashboard and team permissions', () => {
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.DASHBOARD_READ);
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.TEAM_READ);
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.AUDIT_READ);
  });

  it('includes granular page management permissions', () => {
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.PAGE_LOGIN_IMAGES_MANAGE);
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.PAGE_LOGIN_IMAGES_CREATE);
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.PAGE_LOGIN_IMAGES_UPDATE);
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.PAGE_LOGIN_IMAGES_DELETE);
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.PAGE_LOGIN_IMAGES_TOGGLE);
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.PAGE_LOGIN_PACKAGES_READ);
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.PAGE_STATUS_SERVICES_MANAGE);
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.PAGE_SPEED_READ);
  });

  it('honors section-wide page_management shortcuts', () => {
    expect(
      hasPermission(
        [PERMISSIONS.PAGE_MANAGEMENT_MANAGE],
        PERMISSIONS.PAGE_LOGIN_IMAGES_MANAGE,
      ),
    ).toBe(true);
    expect(
      hasPermission(
        [PERMISSIONS.PAGE_MANAGEMENT_MANAGE],
        PERMISSIONS.PAGE_LOGIN_IMAGES_CREATE,
      ),
    ).toBe(true);
    expect(
      hasPermission(
        [PERMISSIONS.PAGE_LOGIN_IMAGES_MANAGE],
        PERMISSIONS.PAGE_LOGIN_IMAGES_DELETE,
      ),
    ).toBe(true);
    expect(
      hasPermission(
        [PERMISSIONS.PAGE_MANAGEMENT_READ],
        PERMISSIONS.PAGE_LOGIN_TICKER_READ,
      ),
    ).toBe(true);
    expect(
      hasPermission(
        [PERMISSIONS.PAGE_MANAGEMENT_READ],
        PERMISSIONS.PAGE_LOGIN_TICKER_MANAGE,
      ),
    ).toBe(false);
    expect(
      hasPermission(
        [PERMISSIONS.PAGE_LOGIN_IMAGES_MANAGE],
        PERMISSIONS.PAGE_LOGIN_IMAGES_MANAGE,
      ),
    ).toBe(true);
  });

  it('includes live channel permissions and shortcuts', () => {
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.LIVE_CHANNELS_READ);
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.LIVE_CHANNELS_MANAGE);
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.LIVE_CHANNELS_CREATE);
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.LIVE_CHANNELS_UPDATE);
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.LIVE_CHANNELS_DELETE);
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.LIVE_CHANNELS_TOGGLE);
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.LIVE_CHANNELS_CONTROL);
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.LIVE_ENCODING_READ);
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.LIVE_ENCODING_UPDATE);
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.LIVE_VIEWING_PAGE_READ);
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.LIVE_VIEWING_PAGE_UPDATE);
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.LIVE_VIEWING_PAGE_TOGGLE);
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.LIVE_VIEWING_REPORTS_READ);
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.LIVE_VIEWING_REPORTS_MANAGE);
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.LIVE_VIEWING_REPORTS_UPDATE);
    expect(ALL_PERMISSIONS).toContain(PERMISSIONS.LIVE_VIEWING_REPORTS_DELETE);
    expect(
      hasPermission([PERMISSIONS.LIVE_MANAGE], PERMISSIONS.LIVE_CHANNELS_CREATE),
    ).toBe(true);
    expect(
      hasPermission(
        [PERMISSIONS.LIVE_READ],
        PERMISSIONS.LIVE_VIEWING_REPORTS_READ,
      ),
    ).toBe(true);
    expect(
      hasPermission(
        [PERMISSIONS.LIVE_MANAGE],
        PERMISSIONS.LIVE_VIEWING_REPORTS_UPDATE,
      ),
    ).toBe(true);
    expect(
      hasPermission(
        [PERMISSIONS.LIVE_VIEWING_REPORTS_MANAGE],
        PERMISSIONS.LIVE_VIEWING_REPORTS_DELETE,
      ),
    ).toBe(true);
    expect(
      hasPermission(
        [PERMISSIONS.LIVE_CHANNELS_MANAGE],
        PERMISSIONS.LIVE_CHANNELS_DELETE,
      ),
    ).toBe(true);
    expect(
      hasPermission([PERMISSIONS.LIVE_READ], PERMISSIONS.LIVE_CHANNELS_READ),
    ).toBe(true);
    expect(
      hasPermission([PERMISSIONS.LIVE_READ], PERMISSIONS.LIVE_CHANNELS_CREATE),
    ).toBe(false);
    expect(
      hasPermission(
        [PERMISSIONS.LIVE_CHANNELS_TOGGLE],
        PERMISSIONS.LIVE_CHANNELS_TOGGLE,
      ),
    ).toBe(true);
    expect(
      hasPermission(
        [PERMISSIONS.LIVE_VIEWING_PAGE_MANAGE],
        PERMISSIONS.LIVE_VIEWING_PAGE_TOGGLE,
      ),
    ).toBe(true);
    expect(
      hasPermission([PERMISSIONS.LIVE_READ], PERMISSIONS.LIVE_ENCODING_READ),
    ).toBe(true);
  });
});
