import { Worker } from "bullmq";
import connection from "../config/redis";
import { sendEmail } from "../lib/mailer";

const emailWorker = new Worker(
  "email-queue",
  async (job) => {
    const { email, subject, body } = job.data;

    console.log("Sending email to:", email);

    await sendEmail(email, subject, body);

    return { success: true };
  },
  { connection }
);

emailWorker.on("completed", (job) => {
  console.log(`Job ${job?.id} completed`);
});

emailWorker.on("failed", (job, err) => {
  console.log(`Job ${job?.id} failed`, err);
});