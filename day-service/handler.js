'use strict';

// Helper function
const getDayFromDate = (dateString) => {
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wendesday', 'Thursday', 'Friday', 'Saturday'];
  const date = new Date(Date.parse(dateString));
  const dayIndex = date.getDay();
  const day = DAYS[dayIndex];
  return day;
}

module.exports.calculateDay = (event, context, callback) => {
  console.log('calculateDay Invoked...');
  const input = JSON.parse(event.body); // get http body from event
  console.log(context); // log Lambda Context
  console.log(event); // log event
  console.log(input); // log http body
  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*', // Required for CORS support to work
    },
    body: JSON.stringify({
      date: input.date,
      day: getDayFromDate(input.date), // return result
    }),
  };

  callback(null, response);
};
