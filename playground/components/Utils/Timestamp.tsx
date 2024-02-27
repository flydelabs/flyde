function padZero(num: number, length: number) {
  return num.toString().padStart(length, "0");
}

const padZero2 = (num: number) => padZero(num, 2);
const padZero3 = (num: number) => padZero(num, 3);

export function Timestamp({ timestamp }: { timestamp: number }) {
  const date = new Date(timestamp);
  // format date into HH:MM:SS.mmm
  const timeString = `${padZero2(date.getHours())}:${padZero2(
    date.getMinutes()
  )}:${padZero2(date.getSeconds())}.${padZero3(date.getMilliseconds())}`;

  return <div className="text-2xs  py-1">{timeString}</div>;
}
