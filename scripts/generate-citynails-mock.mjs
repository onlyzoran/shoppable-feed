import { createHash } from "crypto";
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "mock-data/citynails.json");

const ORIGIN = "https://citynails.studio";

const postsData = [
  {
    caption:
      "Маникюр и педикюр в City Nails Москва-Сити — уютная студия, стерильность и топовые мастера. Запись онлайн в профиле.",
    image: "/upload/media/427nn2xxjtl6y0g3yvrr6y6kudqhv0nx.jpg",
  },
  {
    caption:
      "French manicure: аккуратная форма, стойкое покрытие и идеальная линия улыбки.",
    image: "/upload/media/88x7q21xac9uhzev7iehoojkz1ff033b.jpg",
  },
  {
    caption:
      "SPA-педикюр и уход за стопами — расслабление после рабочей недели.",
    image: "/upload/media/tc8qt39uuzl9s1tw79hqdea1kx0gsfsp.jpg",
  },
  {
    caption:
      "Наращивание ресниц: объём 2D–4D, бережная работа и долгий результат.",
    image: "/upload/media/ij1prmn6kp52z8ag10116mateyrqc2q1.jpg",
  },
  {
    caption:
      "Стрижка и укладка в City Nails — парикмахерские услуги в сети студий красоты.",
    image: "/upload/media/tfor0qmqfohjxpdc4wrt3v2f1asol2mp.jpg",
  },
  {
    caption:
      "Комбо «маникюр + педикюр» — выгоднее вместе. Успейте записаться на удобное время.",
    image: "/upload/media/28d8d431s8n96ywdgolxhh1jcqy37d10.jpg",
  },
  {
    caption:
      "Новый дизайн ногтей: минимализм, chrome и нежные оттенки весны.",
    image: "/upload/media/8o36fql965znd7c9dc0yeog3bt24lz3i.jpg",
  },
  {
    caption:
      "Брови и ламинирование — выразительный взгляд за один визит.",
    image: "/upload/media/ei58tqv9gh70zwlcbiaivul3ilt4laoi.jpg",
  },
  {
    caption:
      "Подарочные сертификаты City Nails — идеальный подарок для близких.",
    image: "/upload/media/jk02qpnw5awiim42ax9yq49kpgdv4cme.jpg",
  },
  {
    caption:
      "Студия рядом с метро Деловой центр. Ждём вас на маникюр и педикюр.",
    image: "/upload/media/2024-09-18/e8uplufcv8il1itvqeedwyv0mzus5pse.jpg",
  },
  {
    caption: "Команда City Nails — мастера, которым доверяют с 2015 года.",
    image: "/upload/media/tfor0qmqfohjxpdc4wrt3v2f1asol2mp.jpg",
  },
  {
    caption:
      "Акции недели на уходовые процедуры — подробности на citynails.studio",
    image: "/upload/media/427nn2xxjtl6y0g3yvrr6y6kudqhv0nx.jpg",
  },
];

function vendorId(seed) {
  return createHash("sha1").update(seed).digest("hex");
}

function shortcode(index) {
  return `CityNails${String(index).padStart(2, "0")}`;
}

function buildPost(index, caption, imagePath) {
  const code = shortcode(index);

  return {
    vendorId: vendorId(code),
    type: "image",
    link: `https://www.instagram.com/p/${code}/`,
    publishedAt: new Date(Date.UTC(2026, 8, 7 - index, 10, 0, 0)).toISOString(),
    author: {
      username: "citynails_moscow",
      profilePictureUrl: "",
      isVerifiedProfile: false,
      name: "CITY NAILS",
      biography: null,
    },
    media: [
      {
        type: "image",
        thumbnail: { url: `${ORIGIN}${imagePath}` },
      },
    ],
    caption,
    commentsCount: 6 + index,
    likesCount: 90 + index * 8,
    shareCount: null,
  };
}

const payload = postsData.map((post, index) =>
  buildPost(index + 1, post.caption, post.image),
);

writeFileSync(outPath, `${JSON.stringify({ payload }, null, 4)}\n`);
console.log(`Wrote ${payload.length} posts to ${outPath}`);
