import type { MediaType } from "@/lib/instagram/types";

export type ShoppableButton = {
  label: string;
  url: string;
};

export type CommercialCategory = "salon" | "travel" | "retail" | "generic";

export type ShoppableInput = {
  caption: string;
  mediaType: MediaType;
  username: string;
  profileBio?: string;
  profileExternalUrl?: string;
  profileLinks?: string[];
};

export const MAX_SHOPPABLE_BUTTONS = 3;
