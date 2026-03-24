ALTER TABLE "commentary" RENAME COLUMN "minute" TO "minutes";--> statement-breakpoint
ALTER TABLE "commentary" DROP CONSTRAINT "commentary_match_minute_seq_unique";--> statement-breakpoint
ALTER TABLE "commentary" ADD CONSTRAINT "commentary_match_minute_seq_unique" UNIQUE("match_id","minutes","sequence");