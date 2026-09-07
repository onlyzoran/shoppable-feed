"use client";

import { useEffect, useState } from "react";

import type { Post } from "@/lib/instagram/types";
import { buildPostsApiUrl } from "@/lib/api/build-posts-url";
import { APP_NAME } from "@/lib/constants";
import { EXAMPLE_SOURCES } from "@/lib/mock-data/examples";

import { FeedSkeleton } from "./FeedSkeleton";
import { PostCard } from "./PostCard";
import { ProfileUrlForm } from "./ProfileUrlForm";
import {
  BUTTON_PLACEMENT_OPTIONS,
  type ButtonPlacement,
} from "./button-placement";
import styles from "./feed.module.css";

type FeedStatus = "idle" | "loading" | "success" | "error";

type ApiErrorPayload = {
  error?: string;
  code?: string;
};

const SHOW_PROFILE_FORM = false;
const DEFAULT_EXAMPLE = EXAMPLE_SOURCES[0];

function normalizeProfileUrl(url: string): string {
  return url.trim().replace(/\/+$/, "").toLowerCase();
}

const EMPTY_INPUT_MESSAGE =
  "Введите ссылку на профиль Instagram, например https://www.instagram.com/username/";

export function FeedPage() {
  const [profileUrl, setProfileUrl] = useState(
    DEFAULT_EXAMPLE?.profileUrl ?? "",
  );
  const [posts, setPosts] = useState<Post[]>([]);
  const [status, setStatus] = useState<FeedStatus>(
    DEFAULT_EXAMPLE ? "loading" : "idle",
  );
  const [hasLoadedOnce, setHasLoadedOnce] = useState(Boolean(DEFAULT_EXAMPLE));
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [buttonPlacement, setButtonPlacement] =
    useState<ButtonPlacement>("below");

  const loadPosts = async (url: string) => {
    setStatus("loading");
    setFetchError(null);
    setInlineError(null);

    try {
      const response = await fetch(buildPostsApiUrl(url));

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

  const handleExampleClick = (url: string) => {
    setProfileUrl(url);
    setHasLoadedOnce(true);
    setInlineError(null);
    void loadPosts(url);
  };

  useEffect(() => {
    if (!DEFAULT_EXAMPLE) {
      return;
    }

    void loadPosts(DEFAULT_EXAMPLE.profileUrl);
  }, []);

  const activeProfileUrl = normalizeProfileUrl(profileUrl);

  const showIdleHint = !hasLoadedOnce && status !== "loading";
  const showEmptyPosts =
    status === "success" && posts.length === 0 && hasLoadedOnce;

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <h1 className={styles.title}>{APP_NAME}</h1>
        {SHOW_PROFILE_FORM ? (
          <>
            <p className={styles.subtitle}>
              Вставьте ссылку на Instagram-профиль, чтобы загрузить последние посты
              в ленту.
            </p>
            <ProfileUrlForm
              value={profileUrl}
              onChange={setProfileUrl}
              onSubmit={handleSubmit}
              disabled={status === "loading"}
              inlineError={inlineError}
            />
          </>
        ) : null}
        {EXAMPLE_SOURCES.length > 0 ? (
          <div className={styles.examples}>
            <span className={styles.examplesLabel}>Примеры:</span>
            <ul className={styles.examplesList}>
              {EXAMPLE_SOURCES.map((example) => (
                <li key={example.id}>
                  <button
                    type="button"
                    className={`${styles.exampleButton}${
                      activeProfileUrl ===
                      normalizeProfileUrl(example.profileUrl)
                        ? ` ${styles.exampleButtonActive}`
                        : ""
                    }`}
                    onClick={() => handleExampleClick(example.profileUrl)}
                    disabled={status === "loading"}
                  >
                    {example.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className={styles.modeSection}>
          <span className={styles.examplesLabel}>Кнопки:</span>
          <div
            className={styles.modeToggle}
            role="radiogroup"
            aria-label="Режим отображения кнопок"
          >
            {BUTTON_PLACEMENT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={buttonPlacement === option.value}
                className={`${styles.modeButton}${
                  buttonPlacement === option.value
                    ? ` ${styles.modeButtonActive}`
                    : ""
                }`}
                onClick={() => setButtonPlacement(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className={styles.content}>
        {showIdleHint ? (
          <p className={styles.hint}>
            Выберите пример слева — здесь появится сетка карточек постов.
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
              <PostCard
                key={post.id}
                post={post}
                buttonPlacement={buttonPlacement}
              />
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
