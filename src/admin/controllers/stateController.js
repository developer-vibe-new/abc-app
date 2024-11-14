
const services = require('../services/stateService');




exports.createState = async(req,res,next)=>{
    try {
        const stateData = await services.stateCrud(req);
        
        console.log("stateData", stateData);
        if(stateData.status){
            return res
              .status(200)
              .json(Object.assign({ success: stateData.status }, stateData));

        } else {
            return res
          .status(400)
          .json(Object.assign({ success: stateData.status }));
        }

    } catch (error) {
        console.log(error);
    }
}