import { readFile } from "fs/promises";
import { join } from "path";

import { InstagramFetchError } from "@/lib/instagram/errors";
import type { Post } from "@/lib/instagram/types";

import { applyExampleProfile } from "./apply-example-profile";
import { mapVendorPayloadToPosts } from "./parse-vendor-payload";
import type { ExampleSource, VendorPayload } from "./types";

const DEFAULT_LIMIT = 12;
const MIN_LIMIT = 10;
const MAX_LIMIT = 20;

function resolveLimit(limit?: number): number {
  if (limit === undefined) {
    return DEFAULT_LIMIT;
  }

  return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, limit));
}

export async function loadExamplePosts(
  example: ExampleSource,
  limit?: number,
): Promise<Post[]> {
  if (!example.fileName) {
    throw new InstagramFetchError(
      `У примера «${example.label}» не задан файл mock-данных`,
      "FETCH_ERROR",
      502,
    );
  }

  const resolvedLimit = resolveLimit(limit);
  const filePath = join(process.cwd(), "mock-data", example.fileName);

  let rawJson: string;

  try {
    rawJson = await readFile(filePath, "utf8");
  } catch {
    throw new InstagramFetchError(
      `Не удалось загрузить пример «${example.label}»`,
      "FETCH_ERROR",
      502,
    );
  }

  let payload: VendorPayload;

  try {
    payload = JSON.parse(rawJson) as VendorPayload;
  } catch {
    throw new InstagramFetchError(
      `Не удалось разобрать данные примера «${example.label}»`,
      "PARSE_ERROR",
      502,
    );
  }

  const posts = applyExampleProfile(
    mapVendorPayloadToPosts(payload, example.id, resolvedLimit),
    example,
  );

  if (posts.length === 0) {
    throw new InstagramFetchError(
      `У примера «${example.label}» нет доступных постов`,
      "NOT_FOUND",
      404,
    );
  }

  return posts;
}
