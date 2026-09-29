-- AlterTable
CREATE TYPE "EncodingSourceMode" AS ENUM ('passthrough', 'passthrough_ffmpeg', 'encode_cpu', 'encode_gpu');

ALTER TABLE "channels"
ADD COLUMN "sourceMode" "EncodingSourceMode" NOT NULL DEFAULT 'passthrough';
