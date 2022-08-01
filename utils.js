"use strict";

const reverseDate = (date) => date?.split("-")?.reverse().join("-")

// 09:00 to 18:00
const validTime = (time) => /^((09|1[0-7]):[0-5][0-9])|18:00/.test(time);
// DD-MM-YYYY
const validDate = (date) => !isNaN(new Date(reverseDate(date)).getTime())

const toUNIXTime = (date, time) => new Date([reverseDate(date), time].join(" ")).valueOf()
const fromUNIXTime = (utime) => ({
  date: new Date(Number(utime)).toISOString().slice(0, 10).split("-").reverse().join("-"),
  time: new Date(Number(utime)).toTimeString().slice(0, 5),
})

const formatOutput = (input) =>
  input.map((e) => {
    const timeArray = e.split("-");
    if (timeArray.length !== 3) return {}

    const startObj = fromUNIXTime(timeArray[1])
    const endObj = fromUNIXTime(timeArray[2])

    return {
      meetId: timeArray[0],
      date: startObj.date,
      start: startObj.time,
      end: endObj.time,
    };
  });

// hope for the best that it does not conflict
const getRandomId = () => Math.random().toString(16).slice(-4);

const getParams = (url) => {
  const keyValuePairs = url
    .split("?")[1]
    ?.split("&")
    .map((p) => p?.split("=", 2).map(decodeURIComponent));

  const params = {};
  keyValuePairs?.forEach((kv) => (params[kv[0]] = kv[1]));

  return params;
};

const getBody = (req) =>
  new Promise((resolve, reject) => {
    try {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => resolve(body));
    } catch (error) {
      reject(error);
    }
  });

const safeJSONParse = (str) => {
  try {
    return { data: JSON.parse(str) };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  validTime,
  validDate,
  formatOutput,
  getRandomId,
  toUNIXTime,
  fromUNIXTime,

  getParams,
  getBody,
  safeJSONParse,
}
