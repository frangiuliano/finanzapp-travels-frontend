export const OPEN_MOVEMENT_CREATOR_EVENT = 'finanzapp:open-movement-creator';

export function openMovementCreator() {
  window.dispatchEvent(new CustomEvent(OPEN_MOVEMENT_CREATOR_EVENT));
}
