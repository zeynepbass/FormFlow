export const FORM_STATUSES = {
  draft: { label: 'Taslak', param: 'taslak', tone: 'neutral' },
  published: { label: 'Yayında', param: 'yayinda', tone: 'success' },
  paused: { label: 'Duraklatıldı', param: 'duraklatildi', tone: 'warning' },
  archived: { label: 'Arşivlendi', param: 'arsiv', tone: 'neutral' },
};

export function statusFromParam(param) {
  return Object.keys(FORM_STATUSES).find((status) => FORM_STATUSES[status].param === param);
}
