"use strict";

const fs = require("fs");

const MEET_FILENAME = "my_meetings";

const readLines = (lines = 5) => {
  try {
    // file is created if it does not exist
    const data = fs.readFileSync(MEET_FILENAME, { flag: "as+" });
    let splitLines = data.toString().split("\n");

    if (lines !== -1)
      splitLines = splitLines.filter((line) => line !== "").slice(0, lines);

    return { data: splitLines };
  } catch (error) {
    return { error };
  }
};

const clearFile = () => {
  try {
    fs.writeFileSync(MEET_FILENAME, "", { flag: "w" });
  } catch (error) {
    return { error };
  }
};

const writeLine = (line) => {
  try {
    fs.writeFileSync(MEET_FILENAME, line + "\n", { flag: "as" });
  } catch (error) {
    return { error };
  }
};

const removeLineWhere = (match) => {
  try {
    // read all the lines
    const res = readLines(-1);
    if (res.error) return res;

    const { data } = res;
    let matchFound = false;

    for (let i in data) {
      if (data[i].startsWith(match)) {
        data.splice(i, 1);
        matchFound = true;
        break;
      }
    }

    if (!matchFound) return { error: new Error("No matching meet ID found!") };

    fs.writeFileSync(MEET_FILENAME, data.join("\n"), { flag: "w" });
  } catch (error) {
    return { error };
  }
};

const modifyLineWhere = (match, newData) => {
  try {
    // read all the lines
    const res = readLines(-1);
    if (res.error) throw res.error;

    const { data } = res;
    let matchFound = false;

    for (let i in data) {
      if (data[i].startsWith(match)) {
        data.splice(i, 1, newData);
        matchFound = true;
        break;
      }
    }

    if (!matchFound) return { error: new Error("No matching meet ID found!") };

    fs.writeFileSync(MEET_FILENAME, data.join("\n"), { flag: "w" });
  } catch (error) {
    return { error };
  }
};

module.exports = {
  readLines,
  clearFile,
  writeLine,
  removeLineWhere,
  modifyLineWhere,
};
