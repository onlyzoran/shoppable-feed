"use client";

import { useState } from "react";

import type { Post } from "@/lib/instagram/types";
import { APP_NAME } from "@/lib/constants";

import { FeedSkeleton } from "./FeedSkeleton";
import { PostCard } from "./PostCard";
import { ProfileUrlForm } from "./ProfileUrlForm";
import styles from "./feed.module.css";

type FeedStatus = "idle" | "loading" | "success" | "error";

type ApiErrorPayload = {
  error?: string;
  code?: string;
};

const EMPTY_INPUT_MESSAGE =
  "Введите ссылку на профиль Instagram, например https://www.instagram.com/username/";

export function FeedPage() {
  const [profileUrl, setProfileUrl] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [status, setStatus] = useState<FeedStatus>("idle");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadPosts = async (url: string) => {
    setStatus("loading");
    setFetchError(null);
    setInlineError(null);

    try {
      const response = await fetch(
        `/api/posts?url=${encodeURIComponent(url.trim())}`,
      );

      if (!response.ok) {
        const payload = (await response.json()) as ApiErrorPayload;
        setPosts([]);
        setStatus("error");
        setFetchError(
          payload.error ??
            "Не удалось загрузить посты. Попробуйте другую ссылку.",
        );
        return;
      }

      const data = (await response.json()) as Post[];
      setPosts(data);
      setStatus("success");
    } catch {
      setPosts([]);
      setStatus("error");
      setFetchError("Сетевая ошибка при загрузке постов. Проверьте соединение.");
    }
  };

  const handleSubmit = () => {
    setHasLoadedOnce(true);

    if (!profileUrl.trim()) {
      setInlineError(EMPTY_INPUT_MESSAGE);
      setStatus("idle");
      setPosts([]);
      setFetchError(null);
      return;
    }

    void loadPosts(profileUrl);
  };

  const showIdleHint = !hasLoadedOnce && status !== "loading";
  const showEmptyPosts =
    status === "success" && posts.length === 0 && hasLoadedOnce;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{APP_NAME}</h1>
        <p className={styles.subtitle}>
          Вставьте ссылку на Instagram-профиль, чтобы загрузить последние посты в
          ленту.
        </p>
        <ProfileUrlForm
          value={profileUrl}
          onChange={setProfileUrl}
          onSubmit={handleSubmit}
          disabled={status === "loading"}
          inlineError={inlineError}
        />
      </header>

      {showIdleHint ? (
        <p className={styles.hint}>
          Укажите URL профиля и нажмите «Загрузить» или Enter — здесь появится
          сетка карточек постов.
        </p>
      ) : null}

      {status === "loading" ? <FeedSkeleton /> : null}

      {status === "error" && fetchError ? (
        <div className={`${styles.alert} ${styles.alertError}`} role="alert">
          {fetchError}
        </div>
      ) : null}

      {showEmptyPosts ? (
        <div className={`${styles.alert} ${styles.alertEmpty}`} role="status">
          У этого профиля пока нет постов для отображения.
        </div>
      ) : null}

      {status === "success" && posts.length > 0 ? (
        <section className={styles.grid} aria-label="Лента постов">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </section>
      ) : null}
    </main>
  );
}
