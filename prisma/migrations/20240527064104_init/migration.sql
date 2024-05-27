-- CreateTable
CREATE TABLE "Stocks" (
    "id" SERIAL NOT NULL,
    "busy" BOOLEAN,
    "created_at" TIMESTAMP(3),
    "book_id" INTEGER NOT NULL,
    "stock_id" INTEGER NOT NULL,

    CONSTRAINT "Stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Books" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "author_id" INTEGER NOT NULL,
    "rentDuration" INTEGER NOT NULL,
    "pages" INTEGER NOT NULL,
    "books_group_id" INTEGER NOT NULL,
    "publisher_id" INTEGER NOT NULL,
    "collection_id" INTEGER NOT NULL,

    CONSTRAINT "Books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT NOT NULL,
    "location_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rents" (
    "id" SERIAL NOT NULL,
    "stock_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "Rents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Authors" (
    "id" SERIAL NOT NULL,
    "name" TEXT,

    CONSTRAINT "Authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Locations" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "region_id" INTEGER NOT NULL,

    CONSTRAINT "Locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BooksGroups" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "rent_duration" INTEGER NOT NULL,
    "pages" INTEGER NOT NULL,

    CONSTRAINT "BooksGroups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Regions" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publishers" (
    "id" SERIAL NOT NULL,
    "name" TEXT,

    CONSTRAINT "Publishers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collections" (
    "id" SERIAL NOT NULL,
    "name" TEXT,

    CONSTRAINT "Collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comments" (
    "id" SERIAL NOT NULL,
    "text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "stock_id" INTEGER NOT NULL,
    "rent_id" INTEGER,

    CONSTRAINT "Comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsBulk" (
    "id" SERIAL NOT NULL,
    "text" INTEGER NOT NULL,

    CONSTRAINT "SmsBulk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sms" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "phone" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" TEXT,
    "error_reason" TEXT,
    "provider" TEXT NOT NULL,
    "provider_message_id" TEXT NOT NULL,
    "smsbulk_id" INTEGER NOT NULL,

    CONSTRAINT "Sms_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Stocks" ADD CONSTRAINT "Stocks_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "Books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stocks" ADD CONSTRAINT "Stocks_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "Locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Books" ADD CONSTRAINT "Books_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "Authors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Books" ADD CONSTRAINT "Books_books_group_id_fkey" FOREIGN KEY ("books_group_id") REFERENCES "BooksGroups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Books" ADD CONSTRAINT "Books_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "Publishers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Books" ADD CONSTRAINT "Books_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "Collections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "Locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rents" ADD CONSTRAINT "Rents_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "Stocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rents" ADD CONSTRAINT "Rents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Locations" ADD CONSTRAINT "Locations_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "Regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "Stocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_rent_id_fkey" FOREIGN KEY ("rent_id") REFERENCES "Rents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sms" ADD CONSTRAINT "Sms_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sms" ADD CONSTRAINT "Sms_smsbulk_id_fkey" FOREIGN KEY ("smsbulk_id") REFERENCES "SmsBulk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
