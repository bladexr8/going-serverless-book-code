'use strict';

// Helper function
const getDayFromDate = (dateString) => {
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wendesday', 'Thursday', 'Friday', 'Saturday'];
  const date = new Date(Date.parse(dateString));
  if (date == 'Invalid Date') {
    throw new Error('Date parsing failed!');
  }
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
  
  // Explicitly catch errors
  let day;
  try {
    day = getDayFromDate(input.date);
  } catch (e) {
    // Error Response
    const errorResponse = {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: e.message
      })
    };
    callback(null, errorResponse);
    return;
  }

  // Success Response
  const successResponse = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      date: input.date,
      day: day
    })
  };
  callback(null, successResponse);
};
