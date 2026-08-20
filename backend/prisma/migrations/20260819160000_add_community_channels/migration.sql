CREATE TABLE "CommunityChannel" (
  "id" TEXT NOT NULL,
  "communityId" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommunityChannel_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommunityChannel_conversationId_key" ON "CommunityChannel"("conversationId");
CREATE UNIQUE INDEX "CommunityChannel_communityId_slug_key" ON "CommunityChannel"("communityId", "slug");
CREATE INDEX "CommunityChannel_communityId_idx" ON "CommunityChannel"("communityId");
ALTER TABLE "CommunityChannel" ADD CONSTRAINT "CommunityChannel_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityChannel" ADD CONSTRAINT "CommunityChannel_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;