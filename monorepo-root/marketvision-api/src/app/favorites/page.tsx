export default async function FavoritesPage({ searchParams }: { searchParams: Promise<{ telegram_id?: string }> }) {
  const sp = await searchParams;
  const fallbackId = (process.env.NEXT_PUBLIC_DEV_TELEGRAM_ID as string | undefined) || '171989';
  const telegram_id = sp?.telegram_id ?? fallbackId;

  let favorites: string[] = [];
  if (telegram_id) {
    try {
      // TODO: Добавить метод getFavorites в ApiService
      // favorites = await ApiService.getFavorites(telegram_id);
    } catch {
      favorites = [];
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Избранные запросы</h1>
      {!telegram_id && <p>Не передан telegram_id</p>}
      {telegram_id && favorites.length === 0 && <p>Список пуст</p>}
      {telegram_id && favorites.length > 0 && (
        <ul>
          {favorites.map((q) => (
            <li key={q} className="mb-2">
              {q}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


