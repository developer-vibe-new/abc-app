const { Transaction } = require("../../models/transactionsModel");
const moment = require("moment");
const mongoose = require("mongoose");
const { statusCode, resMessage } = require("../../config/default.json");


exports.transactionData = async (req) => {
  try {
    // Pagination setup
    const page = parseInt(req.query.page) || 1;
    const pagesize = parseInt(req.query.pagesize) || 10;

    // Destructure filters from query
    let {
      from_date,
      to_date,
      total,
      search,
      id
    } = req.query;

    const matchConditions = {};

    // Filter by date range
    if (from_date && to_date) {
      const start = moment(from_date, "YYYY-MM-DD").startOf("day").toDate();
      const end = moment(to_date, "YYYY-MM-DD").endOf("day").toDate();
      matchConditions.created = { $gte: start, $lte: end };
    }

    // Filter by exact total amount
    if (total) {
      const totalNum = parseFloat(total);
      if (!isNaN(totalNum)) {
        matchConditions.total = totalNum;
      }
    }

    // Filter by provider ID (driver ID)
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      matchConditions.provider_id = new mongoose.Types.ObjectId(id);
    }

    const pipeline = [];

    // Add initial filters to pipeline
    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    // Join provider (driver) data
    pipeline.push(
      {
        $lookup: {
          from: "providers",
          localField: "provider_id",
          foreignField: "_id",
          as: "driverData",
        },
      },
      {
        $unwind: {
          path: "$driverData",
          preserveNullAndEmptyArrays: true,
        },
      }
    );

    // Add a fullName field by combining driver's first and last name
    pipeline.push({
      $addFields: {
        fullName: {
          $concat: [
            { $ifNull: ["$driverData.first_name", ""] },
            " ",
            { $ifNull: ["$driverData.last_name", ""] },
          ],
        },
      },
    });

    // Search by driver's name or transaction number
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "driverData.first_name": { $regex: search, $options: "i" } },
            { "driverData.last_name": { $regex: search, $options: "i" } },
            { "transaction_no": { $regex: search, $options: "i" } }
          ],
        },
      });
    }

    // Clone pipeline for calculating total earning before pagination
    const pipelineForEarning = [...pipeline];

    // Aggregate total earning
    const totalEarningAgg = await Transaction.aggregate([
      ...pipelineForEarning,
      {
        $group: {
          _id: null,
          totalEarning: { $sum: "$total" }
        }
      }
    ]);
    const totalEarning = totalEarningAgg[0]?.totalEarning || 0;

    // Calculate total record count for pagination
    const countPipeline = [...pipeline, { $count: "total" }];
    const totalCountResult = await Transaction.aggregate(countPipeline);
    const totalRecords = totalCountResult.length > 0 ? totalCountResult[0].total : 0;
    const totalPages = Math.ceil(totalRecords / pagesize);

    // Add sorting, skipping, limiting, and selecting specific fields
    pipeline.push(
      { $sort: { created: -1 } },
      { $skip: (page - 1) * pagesize },
      { $limit: pagesize },
      {
        $project: {
          transaction_no: 1,
          total: 1,
          created: 1,
          fullName: 1,
          onlinepayment: 1,
          offlinepayment: 1,
          refund: 1,
        },
      }
    );

    // Execute final pipeline to fetch paginated transactions
    const transactions = await Transaction.aggregate(pipeline);

    // Return response
    return {
      status: statusCode.OK,
      success: true,
      message: resMessage.Data_Fetch_Successfully,
      totalEarning,
      transactions,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
      },
    };

  } catch (error) {
    // Error response
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message
    };
  }
};
