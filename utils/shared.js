// shared.js
const DiscountStart = require('../cron/discountScheduler');


let cronJob = null;

if(cronJob !== null){
    DiscountStart()
}


module.exports = {
    cronJob
};
