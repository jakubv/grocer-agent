-- CreateTable
CREATE TABLE "TescoProposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "householdId" TEXT NOT NULL,
    "shoppingListId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "estimatedTotal" REAL,
    "cartUrl" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "approvedAt" DATETIME,
    "approvedBy" TEXT,
    CONSTRAINT "TescoProposal_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TescoProposalLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proposalId" TEXT NOT NULL,
    "shoppingItemId" TEXT,
    "rawName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT,
    "searchQuery" TEXT NOT NULL,
    "tescoProductName" TEXT,
    "tescoPrice" REAL,
    "tescoProductUrl" TEXT,
    "tescoProductId" TEXT,
    "confidence" REAL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "failReason" TEXT,
    CONSTRAINT "TescoProposalLine_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "TescoProposal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoreSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "householdId" TEXT NOT NULL,
    "store" TEXT NOT NULL,
    "cookiesJson" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StoreSession_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreSession_householdId_store_key" ON "StoreSession"("householdId", "store");