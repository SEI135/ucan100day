const SEOUL_TIMEZONE = "Asia/Seoul";

function getTodayInSeoul() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: SEOUL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
}

export function getChallengeDay(startDate: string) {
  const todayString = getTodayInSeoul();

  // 날짜만 비교하기 위해 UTC 기준 자정으로 변환
  const start = new Date(`${startDate}T00:00:00Z`);
  const today = new Date(`${todayString}T00:00:00Z`);

  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  const elapsedDays = Math.floor(
    (today.getTime() - start.getTime()) / millisecondsPerDay,
  );

  // 시작일 = D-100
  // 다음 날 = D-99
  const dDay = 100 - elapsedDays;

  return {
    today: todayString,
    elapsedDays,
    dDay,
  };
}

export function getDayNumber(startDate: string) {
  const { elapsedDays } = getChallengeDay(startDate);

  // 시작일 = 1일차
  return elapsedDays + 1;
}