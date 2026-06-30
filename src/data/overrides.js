// Runtime address overrides — discovered by memory scan, stored in localStorage
const KEY_ITEM_SLOT_BASE = 'acnh_itemSlotBase';

export function getItemSlotBase() {
  const v = localStorage.getItem(KEY_ITEM_SLOT_BASE);
  return v ? parseInt(v, 16) : null;
}

export function setItemSlotBase(addr) {
  localStorage.setItem(KEY_ITEM_SLOT_BASE, addr.toString(16).toUpperCase());
}

export function clearItemSlotBase() {
  localStorage.removeItem(KEY_ITEM_SLOT_BASE);
}
