import { TZDate } from '@date-fns/tz';

// Initial picker date: an existing controlled value must pass through
// unchanged (no rounding, no "now" snap) so confirming the displayed
// date keeps it. Only an empty value snaps to the incremented now.
export const pickerInitialDate = (value, timezone, snapMinutes) => (
  value ? new TZDate(value, timezone) : snapMinutes(new TZDate(new Date(), timezone))
);
