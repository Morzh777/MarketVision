export default () => ({
  // оставляем только URL базы из окружения, всё остальное в settings.ts
  database: {
    url: process.env.DATABASE_URL as string,
  },
});
