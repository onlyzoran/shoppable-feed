type PlaceholderProps = {
  title: string;
};

export function Placeholder({ title }: PlaceholderProps) {
  return (
    <main>
      <h1>{title}</h1>
      <p>Каркас приложения. Лента товаров будет добавлена позже.</p>
    </main>
  );
}
