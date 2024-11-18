const service = require('../services/reportService');

exports.viewRideReport = async(req,res,next)=>{
    try {
        const data = await service.allData(req);
        return res.status(200).json(Object.assign({success:data.success},data))
    } catch (error) {
        console.error("Error in viewRideReport:", error);
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message
        };
    }
}