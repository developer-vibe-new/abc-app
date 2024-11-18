const vehicleModel = require('../../models/cars');


exports.vehicleList = async(req,res,next)=>{
    try {
        var page = parseInt(req.query.page) || 1;
        var pagesize = parseInt(req.query.pagesize)|| 10;
        let search_value = req.query.search_value || "";

  
        let pipeline = []
        if(search_value){
           pipeline.push({
            $match:{
                title:{ $regex: search_value, $options: "i"}
            }
           })
        }
        pipeline.push(
            { $sort: { createdAt: -1 } }, 
            { $skip: (page - 1) * pagesize }, 
            { $limit: pagesize } 
        );

        const vehicalView = await vehicleModel.aggregate(pipeline);
        

        return {
            success:true,
            data:vehicalView
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while fetching vehicles Data."
        });
    }
};
