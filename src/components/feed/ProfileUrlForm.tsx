"use client";

import { FormEvent, KeyboardEvent, useState } from "react";

import styles from "./feed.module.css";

type ProfileUrlFormProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  inlineError?: string | null;
};

export function ProfileUrlForm({
  value,
  onChange,
  onSubmit,
  disabled = false,
  inlineError = null,
}: ProfileUrlFormProps) {
  const [touched, setTouched] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    onSubmit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      setTouched(true);
      onSubmit();
    }
  };

  const showInlineError = touched && inlineError;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.inputWrap}>
        <input
          className={`${styles.input}${showInlineError ? ` ${styles.inputError}` : ""}`}
          type="url"
          inputMode="url"
          placeholder="https://www.instagram.com/username/"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-invalid={Boolean(showInlineError)}
          aria-describedby={showInlineError ? "profile-url-error" : undefined}
        />
        {showInlineError ? (
          <p className={styles.inlineError} id="profile-url-error" role="alert">
            {inlineError}
          </p>
        ) : null}
      </div>
      <button className={styles.button} type="submit" disabled={disabled}>
        Загрузить
      </button>
    </form>
  );
}
