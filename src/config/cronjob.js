const { CronJob } = require('cron');
const CronJobService = require('../app/services/cronJobServices');
// 1 0 */15 * * every 15 days on 00:01:00 GMT+0530
exports.sendRideReminder = new CronJob("*/1 * * * *", async function () {
    try {
        console.log('<------ sendRideReminder ------>');
        return CronJobService.sendRideReminder();
    } catch (e) {
        return e;
    }
});