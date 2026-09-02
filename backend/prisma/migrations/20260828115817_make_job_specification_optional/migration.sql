-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_job_specification_id_fkey";

-- AlterTable
ALTER TABLE "employees" ALTER COLUMN "job_specification_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_job_specification_id_fkey" FOREIGN KEY ("job_specification_id") REFERENCES "job_specifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
