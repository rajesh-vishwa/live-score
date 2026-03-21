ALTER TABLE "matches" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "commentary" ADD CONSTRAINT "commentary_match_minute_seq_unique" UNIQUE("match_id","minute","sequence");