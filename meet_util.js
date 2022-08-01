"use strict";

const {
  readLines,
  writeLine,
  removeLineWhere,
  modifyLineWhere,
} = require("./db_util");
const {
  validTime,
  validDate,
  formatOutput,
  getRandomId,
  toUNIXTime,
  fromUNIXTime,
} = require("./utils");

const getBookedSlots = async (params, format = true) => {
  if (!params?.date || !validDate(params.date))
    return { error: Error("Invalid data!") };

  const res = await readLines();
  if (res.error) return res;

  const filteredData = res.data.filter((e) => fromUNIXTime(e?.split("-")[1]).date === params.date)

  if (format)
    return { data: formatOutput(filteredData) };
  
  return { data: filteredData };
};

// without: check for time conflicts without `without` meetId
const timeConflicted = async ({ uStartTime, uEndTime }, without) => {
  const bookedSlots = await readLines(-1);
  if (bookedSlots.error) return bookedSlots;

  const slots = bookedSlots.data
    .filter((e) => e !== "")
    .filter((e) => (without ? !e.startsWith(without) : true))
    .map((slot) => slot.slice(5).split("-"));

  for (const [start, end] of slots)
    if (
      (uStartTime <= start && uEndTime >= end) || // complete overlap
      (uStartTime <= start && uEndTime <= end && uEndTime >= start) || // left overlap
      (uStartTime >= start && uEndTime >= end && uStartTime <= end) || // right overlap
      (uStartTime >= start && uEndTime <= end) // inner overlap
    )
      return { data: true };

  return { data: false };
};

const addMeet = async ({ date, startTime, endTime }) => {
  if (!(typeof date === "string" && date.length > 0))
    return { error: Error("Invalid data!") };

  if (!(validTime(startTime) && validTime(endTime)))
    return { error: Error("Time format unknown or beyond work hours!") };
  if (startTime >= endTime)
    return { error: Error("Meeting should start before it ends!") };
  if (!validDate(date)) return { error: Error("Date format unknown!") };

  const uStartTime = toUNIXTime(date, startTime);
  const uEndTime = toUNIXTime(date, endTime);

  const timeConflictedRes = await timeConflicted({ uStartTime, uEndTime });
  // operational errors
  if (timeConflictedRes.error) return timeConflictedRes;
  // actual conflict check
  if (timeConflictedRes.data)
    return {
      error: Error("Given meet time conflicts with the existing schedule!"),
    };

  const res = await writeLine(`${getRandomId()}-${uStartTime}-${uEndTime}`);
  if (res?.error) return res;

  return { data: "Meet added successfully" };
};

const rescheduleMeet = async ({ meetId, startTime, endTime }) => {
  if (!(validTime(startTime) && validTime(endTime)))
    return { error: Error("Time format unknown or beyond work hours!") };

  // get meet using Id
  const meets = await readLines();
  if (meets.error) return meets;

  const meet = meets.data.filter((m) => m.startsWith(meetId));
  if (meet.length === 0) return { error: Error("No such meet found!") };

  const { date } = fromUNIXTime(meet[0].split("-")[1]);
  const uStartTime = toUNIXTime(date, startTime);
  const uEndTime = toUNIXTime(date, endTime);

  // if there is no conflict after removing the meet with this id, we are good
  const timeConflictedRes = await timeConflicted({ uStartTime, uEndTime }, meetId);
  // file errors
  if (timeConflictedRes.error) return timeConflictedRes;
  // actual conflict check
  if (timeConflictedRes.data)
    return {
      error: Error("Given meet time conflicts with the existing schedule!"),
    };

  const response = await modifyLineWhere(
    meetId,
    `${meetId}-${uStartTime}-${uEndTime}`
  );
  if (response?.error) return response;

  return { data: "Meet rescheduled successfully" };
};

const removeMeet = async (meetId) => {
  if (!meetId || typeof meetId !== "string" || meetId.length !== 4)
    return { error: Error("Invalid data!") };

  const res = await removeLineWhere(meetId);
  if (res?.error) return res;

  return { data: "Meet removed successfully!" };
};

const bulkCancel = async (meetIds) => {
  if (!Array.isArray(meetIds)) return { error: Error("Invalid data!") };

  const responses = meetIds.map(async (meetId) => await removeMeet(meetId));
  if (responses.every((r) => r.error))
    return { error: Error("All meet Ids were invalid!") }

  return { data: "Valid meets cancelled successfully!" };
}

const getAvailableSlots = async (params) => {
  if (!params?.date || !validDate(params.date))
    return { error: Error("Invalid data!") };

  const bookedSlots = await getBookedSlots(params, true);
  if (bookedSlots.error) return bookedSlots;

  bookedSlots.data.sort((a, b) => a.start - b.start);

  const availableSlots = [];
  let recording = false;
  const startTime = "09:00";
  const endTime = "18:00";

  if (bookedSlots.data[0].start !== startTime) {
    availableSlots.push(startTime);
    recording = true;
  }

  for (let i=0; i<bookedSlots.data.length; i++) {
    const data = bookedSlots.data[i];

    if (data.start !== startTime && !recording) {
      availableSlots.push(data.start);
      recording = false;
    } else if (recording) {
      availableSlots.push(data.start);
      recording = true;
    }

    if (data.end !== endTime && recording) {
      availableSlots.push(data.end);
      recording = true;
    }
  }

  if (recording) availableSlots.push(endTime);

  // pair up the available slots
  const pairs = [];
  for (let i=0; i<availableSlots.length; i+=2)
    pairs.push({
      start: availableSlots[i],
      end: availableSlots[i+1],
    })

  return { data: pairs };
};

module.exports = {
  getBookedSlots,
  addMeet,
  rescheduleMeet,
  removeMeet,
  bulkCancel,
  getAvailableSlots,
};
