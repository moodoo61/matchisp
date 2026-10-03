-- حذف القناة لا يحذف المباريات ولا يُرفض: يُصفَّر channelId فقط
ALTER TABLE "sport_matches" DROP CONSTRAINT "sport_matches_channelId_fkey";
ALTER TABLE "sport_matches" ALTER COLUMN "channelId" DROP NOT NULL;
ALTER TABLE "sport_matches" ADD CONSTRAINT "sport_matches_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
