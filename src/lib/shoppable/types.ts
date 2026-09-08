import type { MediaType } from "@/lib/instagram/types";

export type ShoppableButtonKind = "link" | "product";

export type ShoppableButton = {
  kind: ShoppableButtonKind;
  label: string;
  url: string;
  imageUrl?: string;
  price?: string;
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
export const MAX_PRODUCT_BUTTONS = 12;
