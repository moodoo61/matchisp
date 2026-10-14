import { Injectable } from '@nestjs/common';
import { PrismaCoreService } from '../../../database/database.module';

export type UserBrief = { id: string; name: string; username: string };

@Injectable()
export class InventoryUsersService {
  constructor(private readonly prismaCore: PrismaCoreService) {}

  async listMembers(): Promise<UserBrief[]> {
    return this.prismaCore.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, username: true },
      orderBy: { name: 'asc' },
    });
  }

  async loadMap(ids: string[]) {
    const unique = [...new Set(ids.filter(Boolean))];
    if (!unique.length) return new Map<string, UserBrief>();
    const rows = await this.prismaCore.user.findMany({
      where: { id: { in: unique } },
      select: { id: true, name: true, username: true },
    });
    return new Map(rows.map((u) => [u.id, u]));
  }

  brief(users: Map<string, UserBrief>, id: string | null | undefined) {
    if (!id) return null;
    return users.get(id) ?? { id, name: 'عضو محذوف', username: '' };
  }
}
