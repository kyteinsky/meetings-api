const redis = require("redis");

const client = redis.createClient({
  socket: {
    host: "localhost",
    port: 6379,
  },
  // password: '<password>'
});

let clientConnection = false;
client.on("ready", () => {
  console.log("Client is ready!");
  clientConnection = true;
});

client.on("error", (err) => {
  console.log("Error " + err);
});

/*
 * store meets with keys `meet:${meetId}`
 */

// exported functions::

const readLines = async (lines = 5) => {
  if (!clientConnection) return { error: Error("Client is not connected!") };

  const keys = await client.keys("meet:????");
  const data = [];

  if (lines !== -1) {
    for (let i = 0; i < Math.min(lines, keys.length); i++)
      data.push(`${keys[i].slice(-4)}-${await client.get(keys[i])}`);
    return { data };
  }

  for (const i of keys) data.push(`${i.slice(-4)}-${await client.get(i)}`);
  return { data };
};

const writeLine = async (line) => {
  if (!clientConnection) return { error: Error("Client is not connected!") };

  await client.set(`meet:${line.split("-")[0]}`, line.slice(5));
};

const removeLineWhere = async (match) => {
  if (!clientConnection) return { error: Error("Client is not connected!") };

  const keys = await client.keys("meet:????");
  for (const key of keys) {
    if (key.slice(5) === match) {
      await client.del(key);
      return;
    }
  }

  return { error: Error("No matching meet ID found!") };
};

const modifyLineWhere = async (match, newData) => {
  if (!clientConnection) return { error: Error("Client is not connected!") };

  const keys = await client.keys("meet:????");
  for (const key of keys) {
    if (key.slice(5) === match) {
      await client.set(key, newData.slice(5));
      return;
    }
  }

  return { error: Error("No matching meet ID found!") };
};

(async () => {
  await client.connect();
})();

module.exports = {
  readLines,
  writeLine,
  removeLineWhere,
  modifyLineWhere,
};
