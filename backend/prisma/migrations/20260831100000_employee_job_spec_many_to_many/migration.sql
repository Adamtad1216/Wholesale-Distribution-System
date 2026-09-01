-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_job_specification_id_fkey";

-- AlterTable
ALTER TABLE "employees" DROP COLUMN "job_specification_id";

-- CreateTable
CREATE TABLE "employee_job_specifications" (
    "employee_id" UUID NOT NULL,
    "job_specification_id" UUID NOT NULL,

    CONSTRAINT "employee_job_specifications_pkey" PRIMARY KEY ("employee_id","job_specification_id")
);

-- AddForeignKey
ALTER TABLE "employee_job_specifications" ADD CONSTRAINT "employee_job_specifications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_job_specifications" ADD CONSTRAINT "employee_job_specifications_job_specification_id_fkey" FOREIGN KEY ("job_specification_id") REFERENCES "job_specifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
