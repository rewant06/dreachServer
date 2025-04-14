npm i

npx prisma
npx prisma init
npx prisma migrate dev --name init
npm install @prisma/client

npx prisma db push --force-reset
npx prisma db seed
npx prisma studio

npx prisma validate

npm run start:dev	 Starts the development server with hot-reloading enabled.