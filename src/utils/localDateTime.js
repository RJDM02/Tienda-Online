const pad = (value) => String(value).padStart(2, '0');

export const formatLocalDateTime = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const mergeDatePart = (currentValue, newDateValue) => {
  if (!newDateValue) return currentValue;
  const current = currentValue ? new Date(currentValue) : new Date();
  const nextDate = new Date(newDateValue);
  current.setFullYear(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());
  return current;
};

export const mergeTimePart = (currentValue, newTimeValue) => {
  if (!newTimeValue) return currentValue;
  const current = currentValue ? new Date(currentValue) : new Date();
  const nextTime = new Date(newTimeValue);
  current.setHours(nextTime.getHours(), nextTime.getMinutes(), nextTime.getSeconds(), 0);
  return current;
};
