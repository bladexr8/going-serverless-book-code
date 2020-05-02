const LambdaTester = require('lambda-tester');
const { calculateDay } = require('../handler');

const testEvent = {
    body: '{ "date": "18 March 1973"}'
};

describe('handler()', () => {
    test('returns the correct day of the week', () => {
        LambdaTester(calculateDay)  // which lambda function to test
            .event(testEvent)
            .expectResult((response) => {
                // Test assertions
                const data = JSON.parse(response.body);
                expect(data.day).toBe('Sunday');
            });
    });
});