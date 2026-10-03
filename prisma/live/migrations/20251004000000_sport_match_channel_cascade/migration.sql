-- حذف القناة يزيل المباريات المرتبطة بدلاً من رفض الحذف
ALTER TABLE "sport_matches" DROP CONSTRAINT "sport_matches_channelId_fkey";
ALTER TABLE "sport_matches" ADD CONSTRAINT "sport_matches_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
