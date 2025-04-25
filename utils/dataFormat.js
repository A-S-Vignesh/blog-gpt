export const formattedDate = (currentDate) => {
  const date = new Date(currentDate);
  const weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dayOfWeek = weekdays[date.getUTCDay()];
  const dayOfMonth = date.getUTCDate();
  const monthIndex = date.getUTCMonth();
  const month = months[monthIndex];
  const year = date.getUTCFullYear();
  const newDate = `${dayOfWeek}, ${dayOfMonth} ${month} ${year}`;

  return newDate;
};
