import type { PetKitchenPetState } from "@/lib/pet-kitchen";
import type { PetType } from "@/types/database";

export const PET_STICKER_SRC: Partial<Record<PetType, string>> = {
  cat: "/wordpets/pets/cat-happy-v3.png",
  dog: "/wordpets/pets/dog-beagle-happy-v3.png",
  guinea_pig: "/wordpets/pets/guinea-pig-happy-v3.png",
  bird: "/wordpets/pets/bird-happy-v3.png",
  bunny: "/wordpets/pets/bunny-happy-v3.png",
  penguin: "/wordpets/pets/penguin-happy-v3.png",
};

const CAT_KITCHEN_STICKER_SRC: Partial<Record<PetKitchenPetState, string>> = {
  watching: "/wordpets/pets/cat-watching-v3.png",
  sniffing: "/wordpets/pets/cat-watching-v3.png",
  encouraging: "/wordpets/pets/cat-watching-v3.png",
  eating: "/wordpets/pets/cat-eating-donut-v3.png",
  cheering: "/wordpets/pets/cat-celebrating-v3.png",
  full: "/wordpets/pets/cat-celebrating-v3.png",
};

export function petStickerFor(
  petType: PetType,
  kitchenState?: PetKitchenPetState,
): string | undefined {
  if (petType === "cat" && kitchenState) {
    return CAT_KITCHEN_STICKER_SRC[kitchenState] ?? PET_STICKER_SRC[petType];
  }

  return PET_STICKER_SRC[petType];
}
