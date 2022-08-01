"use strict";

const {
  addMeet,
  getBookedSlots,
  rescheduleMeet,
  removeMeet,
  bulkCancel,
  getAvailableSlots,
} = require("./meet_util");
const { getParams, getBody, safeJSONParse } = require("./utils");

const handleResponse = ({ res, data }) => {
  if (data.error) {
    // didn't bother with 400 and 500 for different errors
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: data.error.message }));
    return;
  }
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
};

function endpointMan(req, res) {
  this.req = req;
  this.res = res;
}
endpointMan.prototype.forEndpoint = function (endpoint, method, cb) {
  console.log(endpoint, method);

  if (endpoint === null) {
    this.res.writeHead(404, { "Content-Type": "application/json" });
    this.res.end(JSON.stringify({ error: "Invalid endpoint!" }));
    return false;
  }

  let reqEndpoint = this.req.url.split("?")[0];
  if (reqEndpoint.endsWith("/")) reqEndpoint = reqEndpoint.slice(0, -1);
  if (reqEndpoint !== endpoint) return false;

  if (this.req.method !== method) {
    this.res.writeHead(400, { "Content-Type": "application/json" });
    this.res.end(
      JSON.stringify({ error: "Invalid method for this endpoint!" })
    );
    return true;
  }

  cb(this.res);
  return true;
};

module.exports.routeEndpoints = async (req, res) => {
  const app = new endpointMan(req, res);

  app.forEndpoint("/booked_slots", "GET", async (res) => {
    const params = getParams(req.url);
    const bookedSlots = await getBookedSlots(params);
    handleResponse({ res, data: bookedSlots });
  }) ||

  app.forEndpoint("/schedule", "POST", async (res) => {
    const body = await getBody(req);
    const JSONBody = safeJSONParse(body);
    const response = await addMeet({
      date: JSONBody?.data?.date,
      startTime: JSONBody?.data?.start,
      endTime: JSONBody?.data?.end,
    });
    handleResponse({ res, data: response });
  }) ||

  app.forEndpoint("/reschedule", "POST", async (res) => {
    const body = await getBody(req);
    const JSONBody = safeJSONParse(body);
    const response = await rescheduleMeet({
      meetId: JSONBody?.data?.meetId,
      startTime: JSONBody?.data?.start,
      endTime: JSONBody?.data?.end,
    });
    handleResponse({ res, data: response });
  }) ||

  app.forEndpoint("/cancel", "POST", async (res) => {
    const body = await getBody(req);
    const JSONBody = safeJSONParse(body);
    const cancelMeet = await removeMeet(JSONBody?.data?.meetId);
    handleResponse({ res, data: cancelMeet });
  }) ||

  app.forEndpoint("/available_slots", "GET", async (res) => {
    const params = getParams(req.url);
    const availableSlots = await getAvailableSlots(params);
    handleResponse({ res, data: availableSlots });
  }) ||

  app.forEndpoint("/bulk_cancel", "POST", async (res) => {
    const body = await getBody(req);
    const JSONBody = safeJSONParse(body);
    const cancelMeets = await bulkCancel(JSONBody?.data?.meetIds);
    handleResponse({ res, data: cancelMeets });
  }) ||

  app.forEndpoint(null);
};
