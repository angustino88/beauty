import { toResourceOption, type ResourceSelectOption } from "@/components/inputs/ResourceOption";
import {
  classifyRoomSlots,
  classifyStationSlots,
  type ClassifiedSlotOption,
  type ClassifySlotsParams,
  type RoomSlotLike,
  type StationSlotLike,
} from "./slotOptionModel";
import styles from "./slotOptions.module.css";

function renderClassifiedSlot(option: ClassifiedSlotOption): ResourceSelectOption {
  const aside = option.statusTag ? (
    <span className={`${styles.tag} ${styles[option.tone]}`}>{option.statusTag}</span>
  ) : undefined;

  return toResourceOption(
    {
      id: option.id,
      sku: option.code,
      name: option.label,
      keywords: option.statusTag ? [option.statusTag] : undefined,
    },
    {
      aside,
      disabled: option.disabled,
    },
  );
}

export function buildStationSlotOptions(
  slots: readonly StationSlotLike[],
  params?: ClassifySlotsParams,
): { classified: ClassifiedSlotOption[]; options: ResourceSelectOption[] } {
  const classified = classifyStationSlots(slots, params);
  return { classified, options: classified.map(renderClassifiedSlot) };
}

export function buildRoomSlotOptions(
  slots: readonly RoomSlotLike[],
  params?: ClassifySlotsParams,
): { classified: ClassifiedSlotOption[]; options: ResourceSelectOption[] } {
  const classified = classifyRoomSlots(slots, params);
  return { classified, options: classified.map(renderClassifiedSlot) };
}

export { getRoomSlotsHint, getStationSlotsHint } from "./slotOptionModel";
