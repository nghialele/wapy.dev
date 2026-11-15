-- DropTable
DROP TABLE "PaddleUserDetails";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "trial_started_at",
DROP COLUMN "sub_next_notification",
DROP COLUMN "full_access";
