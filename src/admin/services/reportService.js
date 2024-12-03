const rideModel = require('../../models/ride');
// const transactionModel = require('../../models/transactionsModel');
const moment = require('moment');

exports.allData = async (req) => {
    try {
        var page = parseInt(req.query.page) || 1;
        var pagesize = parseInt(req.query.pagesize) || 10;
        let from_date = req.query.from_date || "";
        let to_date = req.query.to_date || "";
        let pipeline = [];

        from_date = (from_date) ? from_date : moment().subtract(1, 'months').format("DD-MM-YYYY");
        to_date = (to_date) ? to_date : moment().add(1, 'days').format("DD-MM-YYYY");


        var start_filter = moment(from_date, "DD-MM-YYYY").toDate();
        var end_filter = moment(to_date, "DD-MM-YYYY").toDate();

        if (from_date && to_date) {

            pipeline.push({
                $match: {
                    $and: [{
                        "time.ride_on": {
                            $gte: start_filter
                        }
                    }, {
                        "time.ride_on": {
                            $lte: end_filter
                        }
                    }]
                }
            });
        } else if (from_date) {
            pipeline.push({
                $match: {
                    "time.ride_on": {
                        $gte: start_filter
                    }
                }
            });

        } else if (to_date) {
            pipeline.push({
                $match: {
                    "time.ride_on": {
                        $lte: end_filter
                    }
                }
            });
        }



        pipeline.push(
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * pagesize },
            { $limit: pagesize }
        );

        const rideViewDetails = await rideModel.aggregate(pipeline);

        const reportData = await rideModel.find({});
        let totalRides = reportData.length;
        let completedRides = await rideModel.find({ ride_status: "finished" });
        let totalCompletedRides = completedRides.length;
        let cancelledRides = await rideModel.find({ ride_status: "cancelled" });
        let totalCancelledRides = cancelledRides.length;
        return {
            success: true,
            data: { totalRides, totalCompletedRides, totalCancelledRides, rideViewDetails }
        };
    } catch (error) {
        console.log(error);
    }
};