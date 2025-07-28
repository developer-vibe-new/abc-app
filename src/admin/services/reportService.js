const rideModel = require('../../models/ride');
const driverModel = require('../../models/providerModel');
const moment = require('moment');
const mongoose = require('mongoose');
const { statusCode, resMessage } = require('../../config/default.json');

exports.allData = async (req) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pagesize = parseInt(req.query.pagesize) || 10;

    let {
      from_date,
      to_date,
      providername,
      ride_status,
      payment_type,
      fare_charged,
      search
    } = req.query;

    const { id } = req.query;

    const matchConditions = [];

    if (id) {
      const driverExists = await driverModel.exists({ _id: id });
      if (!driverExists) {
        return {
          status: statusCode.OK,
          success: true,
          message: resMessage.Data_Fetch_Successfully,
          rides: [],
          totalRides: 0,
          totalCompletedRides: 0,
          totalCancelledRides: 0,
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalRecords: 0
          }
        };
      }
      matchConditions.push({ "basic.provider_id": id });
    }

    if (from_date && to_date) {
      const start_filter = moment(from_date, 'YYYY-MM-DD').startOf('day').toDate();
      const end_filter = moment(to_date, 'YYYY-MM-DD').endOf('day').toDate();

      matchConditions.push({
        created: { $gte: start_filter, $lte: end_filter }
      });
    }

    if (providername) {
      matchConditions.push({ "basic.providername": { $regex: providername, $options: 'i' } });
    }

    if (ride_status) {
      matchConditions.push({ "basic.ride_status": ride_status });
    }

    if (payment_type) {
      matchConditions.push({ "basic.payment_type": payment_type });
    }

    if (fare_charged) {
      const fare = parseFloat(fare_charged);
      if (!isNaN(fare)) {
        matchConditions.push({ "payment.fare_charged": { $eq: fare } });
      }
    }

    if (search) {
      matchConditions.push({
        $or: [
          { "basic.providername": { $regex: search, $options: 'i' } },
          { "basic.ride_status": { $regex: search, $options: 'i' } },
          { "basic.payment_type": { $regex: search, $options: 'i' } }
        ]
      });
    }

    const pipeline = [];

    if (matchConditions.length > 0) {
      pipeline.push({ $match: { $and: matchConditions } });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'users',
          localField: 'basic.user_id',
          foreignField: '_id',
          as: 'userData'
        }
      },
      { $unwind: '$userData' },
      {
        $addFields: {
          providername: '$basic.providername',
          ride_status: '$basic.ride_status',
          payment_type: '$basic.payment_type',
          fare_charged: { $toDouble: '$payment.fare_charged' },
          fname: '$userData.first_name',
          lname: '$userData.last_name'
        }
      }
    );

    const countPipeline = [...pipeline, { $count: 'total' }];
    const totalCountResult = await rideModel.aggregate(countPipeline);
    const totalRecords = totalCountResult.length > 0 ? totalCountResult[0].total : 0;
    const totalPages = Math.ceil(totalRecords / pagesize);

    pipeline.push(
      { $sort: { created: -1 } },
      { $skip: (page - 1) * pagesize },
      { $limit: pagesize },
      {
        $project: {
          providername: 1,
          ride_status: 1,
          payment_type: 1,
          fare_charged: 1,
          created: 1,
          fname: 1,
          lname: 1
        }
      }
    );

    const rideViewDetails = await rideModel.aggregate(pipeline);

    const baseMatch = matchConditions.length > 0 ? { $match: { $and: matchConditions } } : null;

    const totalRidesPipeline = baseMatch ? [baseMatch] : [];
    const totalCompletedPipeline = baseMatch ? [baseMatch] : [];
    const totalCancelledPipeline = baseMatch ? [baseMatch] : [];

    totalCompletedPipeline.push({ $match: { "basic.ride_status": "finished" } });
    totalCancelledPipeline.push({ $match: { "basic.ride_status": "cancelled" } });

    const [totalRidesResult, totalCompletedResult, totalCancelledResult] = await Promise.all([
      rideModel.aggregate([...totalRidesPipeline, { $count: "count" }]),
      rideModel.aggregate([...totalCompletedPipeline, { $count: "count" }]),
      rideModel.aggregate([...totalCancelledPipeline, { $count: "count" }])
    ]);

    const totalRides = totalRidesResult[0]?.count || 0;
    const totalCompletedRides = totalCompletedResult[0]?.count || 0;
    const totalCancelledRides = totalCancelledResult[0]?.count || 0;

    return {
      status: statusCode.OK,
      success: true,
      message: resMessage.Data_Fetch_Successfully,
      totalRides,
      totalCompletedRides,
      totalCancelledRides,
      rides: rideViewDetails,
      pagination: {
        currentPage: page,
        
        totalPages,
        totalRecords
      }
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message
    };
  }
};
exports.ViewAllData = async (req) => {
  try {
    // Extract ride ID from query params
    const { _id } = req.query;

    const matchStage = {}; // MongoDB match filter

    console.log("Incoming Query Params:", req.query);

    // Validate ride ID
    if (_id) {
      if (!mongoose.Types.ObjectId.isValid(_id)) {
        // Return error if the ID is invalid
        return {
          status: 400,
          success: false,
          message: "Invalid ride ID"
        };
      }
      // Convert string ID to ObjectId for querying
      matchStage._id = new mongoose.Types.ObjectId(_id);
    } else {
      // Return error if ride ID is missing
      return {
        status: 400,
        success: false,
        message: "Ride ID is required"
      };
    }

    console.log("MongoDB Match Stage:", JSON.stringify(matchStage, null, 2));

    // Define aggregation pipeline
    const pipeline = [
      { $match: matchStage }, // Filter by ride ID
      {
        $project: {
          _id: 1,
          created: 1,
          "basic.ride_type": 1,
          "basic.ridestationtype": 1,
          "basic.ride_status": 1,
          "basic.bookdistance": 1,
          "basic.payment_type": 1,
          "basic.providername": 1,
          "basic.distance": 1,
          "basic.vehicle": 1,
          time: 1,
          "location.source": 1,
          "location.destination": 1,
          "payment.fare_charged": 1,
          "payment.onlinepayment": 1,
          "payment.offlinepayment": 1
        }
      }
    ];

    // Run aggregation query
    const rideDetails = await rideModel.aggregate(pipeline);

    // Return successful response with ride data
    return {
      status: 200,
      success: true,
      message: "Ride data fetched successfully",
      rides: rideDetails
    };

  } catch (error) {
    // Handle unexpected errors
    console.error("ViewAllData error:", error);
    return {
      status: 500,
      success: false,
      message: error.message
    };
  }
};
